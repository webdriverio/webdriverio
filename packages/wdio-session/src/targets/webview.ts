import fs from 'node:fs'
import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'

import getPort from 'get-port'
import { importOptionalDependency } from '@wdio/utils/node'

import { HINT_DOCTOR, checkBinary, checkDisplayServer, requirePackage } from '../deps.js'
import { usage } from '../errors.js'
import { hasDisplay, toArray, type OpenArgs } from './utils.js'
import type { DriverPlan, OpenPlan, RemoteOptions, TargetPlan } from '../types.js'
// a value import would load webdriverio for every `wdio session` command (see cli.ts)
import type { remote } from 'webdriverio'

const LOG_LEVELS = { '@wdio/session': 'info' } as const

export type WebviewTarget = 'tauri' | 'dioxus'

const TARGETS: Record<WebviewTarget, { pkg: string, binary: string, install: string[], feature: string, optionsKey: 'tauri:options' | 'dioxus:options' }> = {
    tauri: {
        pkg: '@wdio/tauri-service',
        binary: 'tauri-driver',
        install: ['cargo install tauri-driver --locked'],
        feature: 'open a Tauri session',
        optionsKey: 'tauri:options'
    },
    dioxus: {
        pkg: '@wdio/dioxus-service',
        binary: 'wdio-dioxus-driver',
        install: ['pnpm add -D @wdio/dioxus-service'],
        feature: 'open a Dioxus session',
        optionsKey: 'dioxus:options'
    }
}

interface WebviewContext {
    cwd: string
    env?: NodeJS.ProcessEnv
    platform?: NodeJS.Platform
}

interface ServiceModule {
    startWdioSession?: (capabilities: unknown, globalOptions?: { rootDir?: string }) => Promise<WebdriverIO.Browser>
    cleanupWdioSession?: (browser: WebdriverIO.Browser) => Promise<void>
}

export function driverArgs (port: number) {
    return ['--port', String(port)]
}

/**
 * Plan a Tauri or Dioxus session. The driver is spawned unless the service
 * exports `startWdioSession`, which `launchWebview` prefers.
 */
export async function nativeWebviewPlan (target: WebviewTarget, args: OpenArgs, ctx: WebviewContext): Promise<TargetPlan> {
    const spec = TARGETS[target]
    const app = typeof args.url === 'string' ? args.url : ''
    if (!app) {
        throw usage(`Pass the ${target} app path.`, `Example: \`wdio session open ${target} ./my-app\`.`)
    }
    const resolved = path.resolve(ctx.cwd, app)
    if (!fs.existsSync(resolved)) {
        throw usage(`App not found: ${resolved}`)
    }
    const env = ctx.env || process.env
    const host = ctx.platform || process.platform
    await requirePackage(spec.pkg, {
        cwd: ctx.cwd,
        feature: spec.feature,
        from: import.meta.url,
        then: spec.install,
        hint: HINT_DOCTOR(target)
    })
    const loaded = await importOptionalDependency(spec.pkg, {
        feature: spec.feature,
        cwd: ctx.cwd,
        from: import.meta.url
    }) as ServiceModule
    const standalone = typeof loaded.startWdioSession === 'function'
    const binary = standalone
        ? undefined
        : checkBinary(spec.binary, { feature: spec.feature, install: spec.install, env, platform: host, hint: HINT_DOCTOR(target) })
    const port = await getPort()
    const display = host === 'linux' && !hasDisplay(env)
    if (display) {
        checkDisplayServer(spec.feature, env, host)
    }
    const remote: Partial<RemoteOptions> = { hostname: 'localhost', port, path: '/' }
    const driver: DriverPlan | undefined = binary ? { binary, args: driverArgs(port), port } : undefined
    return {
        capabilities: {
            browserName: 'wry',
            [spec.optionsKey]: { application: resolved, args: toArray(args.appArg) }
        } as TargetPlan['capabilities'],
        label: target,
        platform: target,
        applies: ['W'],
        mode: standalone ? 'remote' : 'driver',
        headless: false,
        display,
        driver,
        remote,
        notes: []
    }
}

export function startDriver (driver: DriverPlan) {
    const child: ChildProcess = spawn(driver.binary, driver.args, { stdio: 'ignore', windowsHide: true })
    const ready = new Promise<void>((resolve, reject) => {
        child.once('spawn', () => resolve())
        child.once('error', reject)
    })
    return {
        pid: child.pid ?? -1,
        ready,
        stop: () => new Promise<void>((resolve) => {
            if (child.exitCode !== null || child.signalCode !== null) {
                resolve()
                return
            }
            const timer = setTimeout(() => {
                try {
                    child.kill('SIGKILL')
                } catch {
                    // already gone
                }
            }, 5000)
            child.once('exit', () => {
                clearTimeout(timer)
                resolve()
            })
            try {
                child.kill('SIGTERM')
            } catch {
                clearTimeout(timer)
                resolve()
            }
        })
    }
}

/**
 * Start a Tauri or Dioxus session. Uses the service standalone entry when
 * it exists, otherwise `tauri-driver` / `wdio-dioxus-driver` plus `remote()`.
 */
export async function launchWebview (plan: OpenPlan): Promise<{ browser: WebdriverIO.Browser, end: (died?: boolean) => Promise<void>, pid?: number }> {
    const target: WebviewTarget = plan.platform === 'dioxus' ? 'dioxus' : 'tauri'
    const spec = TARGETS[target]
    const mod = await importOptionalDependency(spec.pkg, {
        feature: spec.feature,
        cwd: plan.cwd,
        from: import.meta.url
    }) as ServiceModule
    if (typeof mod.startWdioSession === 'function') {
        const browser = await mod.startWdioSession([plan.capabilities], { rootDir: plan.cwd })
        const end = async (died?: boolean) => {
            if (died) {
                const pid = (browser.capabilities as Record<string, unknown>)['wdio:driverPID']
                if (typeof pid === 'number') {
                    try {
                        process.kill(pid, 'SIGKILL')
                    } catch {
                        // already gone
                    }
                }
                return
            }
            if (mod.cleanupWdioSession) {
                await mod.cleanupWdioSession(browser).catch(() => undefined)
            }
            await browser.deleteSession()
        }
        return { browser, end }
    }
    if (!plan.driver) {
        throw usage(`No ${spec.binary} command was planned for this session.`)
    }
    const driver = startDriver(plan.driver)
    let browser: WebdriverIO.Browser
    try {
        await driver.ready
        browser = await (await import('webdriverio')).remote({
            ...plan.remote,
            logLevel: plan.remote.logLevel as 'warn',
            logLevels: LOG_LEVELS,
            capabilities: plan.capabilities
        } as Parameters<typeof remote>[0])
    } catch (err) {
        await driver.stop()
        throw err
    }
    const end = async (died?: boolean) => {
        if (!died) {
            await browser.deleteSession().catch(() => undefined)
        }
        await driver.stop()
    }
    return { browser, end, pid: driver.pid }
}
