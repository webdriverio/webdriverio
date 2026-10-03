import path from 'node:path'

import { getCurrentRunnable, setDebugAgentPause } from '@wdio/utils'

import { Session } from './session.js'
import { SessionServer } from './daemon/server.js'
import { createState, ensureRuntimeDir, getArtifactsDir, getRuntimeDir, getSocketPath, removeState } from './daemon/state.js'
import type { Applies, OpenPlan, PlatformKind } from './types.js'

/**
 * Framework timeouts while a run is paused for an agent (RFC §12.2).
 */
export const DEBUG_AGENT_TIMEOUT = 24 * 60 * 60 * 1000

export const DEBUG_AGENT_CLOSED = 'Session closed from wdio session'

export function applyDebugAgentTimeouts <T extends {
    mochaOpts?: { timeout?: number }
    jasmineOpts?: { defaultTimeoutInterval?: number }
    cucumberOpts?: { timeout?: number }
}> (config: T): T {
    config.mochaOpts = { ...config.mochaOpts, timeout: DEBUG_AGENT_TIMEOUT }
    config.jasmineOpts = { ...config.jasmineOpts, defaultTimeoutInterval: DEBUG_AGENT_TIMEOUT }
    config.cucumberOpts = { ...config.cucumberOpts, timeout: DEBUG_AGENT_TIMEOUT }
    return config
}

export function classifyCapabilities (caps: WebdriverIO.Capabilities = {}): { label: string, platform: PlatformKind, applies: Applies[] } {
    const record = caps as Record<string, unknown>
    const platformName = String(record.platformName || record['appium:platformName'] || '').toLowerCase()
    if (platformName === 'android' || platformName === 'ios') {
        return { label: platformName, platform: 'mobile', applies: record.browserName ? ['W', 'M'] : ['M'] }
    }
    /**
     * a desktop browser reports its OS as `platformName` too, only an app
     * session without `browserName` is a desktop app
     */
    if ((platformName === 'mac' || platformName === 'windows') && !record.browserName) {
        return { label: platformName, platform: 'desktop', applies: ['D'] }
    }
    const browserName = typeof record.browserName === 'string' ? record.browserName : 'browser'
    return { label: browserName, platform: 'browser', applies: ['W'] }
}

/**
 * Plan for a session around a browser something else started and owns,
 * e.g. a test worker. It is detached on shutdown, never deleted.
 */
export function attachedPlan (
    browser: WebdriverIO.Browser,
    opts: Pick<OpenPlan, 'name' | 'cwd' | 'artifactsDir' | 'runtimeDir' | 'target'>
): OpenPlan {
    const caps = browser.capabilities || {}
    const kind = classifyCapabilities(caps)
    return {
        ...opts,
        label: kind.label,
        platform: kind.platform,
        applies: kind.applies,
        mode: 'remote',
        capabilities: caps as OpenPlan['capabilities'],
        remote: {},
        headless: true,
        bidi: Boolean((browser as { isBidi?: boolean }).isBidi),
        idleTimeout: 0,
        launchTimeout: 0,
        argv: [],
        notes: [],
        detach: true
    }
}

export interface PauseDebugOptions {
    browser: WebdriverIO.Browser
    cid: string
    spec?: string
    test?: string
    cwd?: string
    runtimeDir?: string
}

/**
 * Expose the worker's browser as `debug-<cid>` until `resume` or `close`.
 * `resume` returns. `close` throws so the current test fails.
 * The browser session itself stays up.
 */
export async function pauseDebugSession (opts: PauseDebugOptions): Promise<void> {
    const name = `debug-${opts.cid}`
    const cwd = opts.cwd || process.cwd()
    const runtimeDir = ensureRuntimeDir(opts.runtimeDir || getRuntimeDir())
    const artifactsDir = getArtifactsDir(name, cwd)
    const caps = opts.browser.capabilities || {}
    const kind = classifyCapabilities(caps)
    const spec = opts.spec ? path.basename(opts.spec) : 'spec'
    const test = opts.test || 'test'
    const plan = attachedPlan(opts.browser, { name, cwd, artifactsDir, runtimeDir, target: 'wdio run' })
    const session = new Session({
        name,
        cwd,
        artifactsDir,
        runtimeDir,
        browser: opts.browser,
        plan
    })
    const socketPath = getSocketPath(runtimeDir, name)
    const server = new SessionServer({
        socketPath,
        handler: (req) => session.dispatch(req)
    })
    session.server = server

    let settle!: () => void
    const done = new Promise<void>((resolve) => {
        settle = resolve
    })
    /**
     * The action's response is written after `onResume` returns. Closing the
     * socket in the same turn drops that response.
     */
    session.onResume = () => {
        setTimeout(settle, 20)
    }

    await server.listen()
    try {
        createState(runtimeDir, {
            name,
            pid: process.pid,
            status: 'ready',
            socket: socketPath,
            token: server.token,
            cwd,
            artifactsDir,
            target: `wdio run (${spec})`,
            label: kind.label,
            platform: kind.platform,
            browserName: caps.browserName,
            browserVersion: caps.browserVersion,
            sessionId: opts.browser.sessionId,
            bidi: plan.bidi,
            startedAt: new Date().toISOString(),
            debug: { spec, test }
        })
    } catch (err) {
        await server.close().catch(() => {})
        throw err
    }

    if (typeof process.send === 'function') {
        process.send({
            origin: 'debugger',
            name: 'agent',
            params: { session: name, spec, test }
        })
    }

    try {
        await done
    } finally {
        await server.close().catch(() => {})
        removeState(runtimeDir, name)
    }

    if (session.get('closedFromSession')) {
        throw new Error(DEBUG_AGENT_CLOSED)
    }
}

/**
 * Replace `browser.debug()` and register the failed-test pause for this worker.
 */
export function enableDebugAgent (opts: { browser: WebdriverIO.Browser, cid: string, specs: string[] }) {
    const pause = (extra: { spec?: string, test?: string } = {}) => {
        const current = getCurrentRunnable()
        return pauseDebugSession({
            browser: opts.browser,
            cid: opts.cid,
            spec: extra.spec || current?.spec || opts.specs[0],
            test: extra.test || current?.test
        })
    }
    /**
     * Protocol commands are non-writable. An own property shadows `debug`.
     */
    Object.defineProperty(opts.browser, 'debug', {
        configurable: true,
        writable: true,
        value: async function debugAgent () {
            await pause()
        }
    })
    setDebugAgentPause(async (info) => {
        await pause({ spec: info.spec, test: info.test })
    })
}
