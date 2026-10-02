import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, afterEach } from 'vitest'

import { applyDebugAgentTimeouts, classifyCapabilities, DEBUG_AGENT_CLOSED, DEBUG_AGENT_TIMEOUT, pauseDebugSession } from '../src/debug.js'
import { send } from '../src/cli/client.js'
import { readState } from '../src/daemon/state.js'

describe('classifyCapabilities', () => {
    it('classifies a desktop browser as a browser even though it reports its OS', () => {
        expect(classifyCapabilities({ browserName: 'chrome', platformName: 'mac' })).toEqual({ label: 'chrome', platform: 'browser', applies: ['W'] })
        expect(classifyCapabilities({ browserName: 'msedge', platformName: 'windows' })).toEqual({ label: 'msedge', platform: 'browser', applies: ['W'] })
    })

    it('classifies a macOS or Windows app session as a desktop app', () => {
        expect(classifyCapabilities({ platformName: 'mac', 'appium:automationName': 'Mac2' } as WebdriverIO.Capabilities))
            .toEqual({ label: 'mac', platform: 'desktop', applies: ['D'] })
        expect(classifyCapabilities({ platformName: 'Windows' })).toEqual({ label: 'windows', platform: 'desktop', applies: ['D'] })
    })

    it('classifies mobile web and native app sessions', () => {
        expect(classifyCapabilities({ platformName: 'Android', browserName: 'chrome' })).toEqual({ label: 'android', platform: 'mobile', applies: ['W', 'M'] })
        expect(classifyCapabilities({ platformName: 'iOS' })).toEqual({ label: 'ios', platform: 'mobile', applies: ['M'] })
    })
})

describe('applyDebugAgentTimeouts', () => {
    it('raises Mocha, Jasmine and Cucumber timeouts to 24h', () => {
        const config = applyDebugAgentTimeouts({
            mochaOpts: { timeout: 10_000, ui: 'bdd' },
            jasmineOpts: { defaultTimeoutInterval: 10_000, stopOnSpecFailure: true },
            cucumberOpts: { timeout: 10_000, failFast: true }
        })
        expect(config.mochaOpts.timeout).toBe(DEBUG_AGENT_TIMEOUT)
        expect(config.mochaOpts.ui).toBe('bdd')
        expect(config.jasmineOpts.defaultTimeoutInterval).toBe(DEBUG_AGENT_TIMEOUT)
        expect(config.jasmineOpts.stopOnSpecFailure).toBe(true)
        expect(config.cucumberOpts.timeout).toBe(DEBUG_AGENT_TIMEOUT)
        expect(config.cucumberOpts.failFast).toBe(true)
        expect(DEBUG_AGENT_TIMEOUT).toBe(24 * 60 * 60 * 1000)
    })
})

describe('pauseDebugSession', () => {
    const dirs: string[] = []

    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    function setup () {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-debug-agent-'))
        dirs.push(dir)
        const runtimeDir = path.join(dir, 'run')
        const browser = {
            sessionId: 'sess',
            capabilities: { browserName: 'chrome', browserVersion: '1' }
        } as unknown as WebdriverIO.Browser
        return { dir, runtimeDir, browser }
    }

    it('close fails the paused test and removes the session', async () => {
        const { dir, runtimeDir, browser } = setup()
        const pending = pauseDebugSession({
            browser,
            cid: '0-0',
            spec: '/tmp/spec.ts',
            test: 'fails',
            cwd: dir,
            runtimeDir
        })
        const state = await waitForState(runtimeDir, 'debug-0-0')
        expect(state.debug).toEqual({ spec: 'spec.ts', test: 'fails' })
        expect(state.target).toBe('wdio run (spec.ts)')
        const closed = await send('debug-0-0', 'close', {}, { runtimeDir })
        expect(closed.text).toContain('Session closed from wdio session')
        await expect(pending).rejects.toThrow(DEBUG_AGENT_CLOSED)
        expect(readState(runtimeDir, 'debug-0-0')).toBeUndefined()
    })

    it('resume lets the test continue and removes the session', async () => {
        const { dir, runtimeDir, browser } = setup()
        const pending = pauseDebugSession({
            browser,
            cid: '0-0',
            spec: 'a.spec.ts',
            test: 'reads the title',
            cwd: dir,
            runtimeDir
        })
        await waitForState(runtimeDir, 'debug-0-0')
        const resumed = await send('debug-0-0', 'resume', {}, { runtimeDir })
        expect(resumed.text).toContain('Resumed "debug-0-0"')
        await expect(pending).resolves.toBeUndefined()
        expect(readState(runtimeDir, 'debug-0-0')).toBeUndefined()
    })
})

async function waitForState (runtimeDir: string, name: string) {
    const start = Date.now()
    while (Date.now() - start < 5_000) {
        const state = readState(runtimeDir, name)
        if (state?.status === 'ready') {
            return state
        }
        await new Promise((resolve) => setTimeout(resolve, 20))
    }
    throw new Error(`session ${name} did not become ready`)
}
