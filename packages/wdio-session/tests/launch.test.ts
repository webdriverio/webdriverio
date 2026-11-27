import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type * as ChildProcess from 'node:child_process'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'

import * as entry from '../src/launch.js'
import { buildPlan } from '../src/targets/index.js'
import { launch, SESSION_LOG_LEVELS } from '../src/targets/launch.js'

const remote = vi.hoisted(() => vi.fn())
vi.mock('webdriverio', () => ({ remote }))
const startDisplayDaemonFromConfig = vi.hoisted(() => vi.fn())
vi.mock('@wdio/display-server', () => ({ startDisplayDaemonFromConfig }))

vi.mock('node:child_process', async (importActual) => ({
    ...await importActual<typeof ChildProcess>(),
    spawn: () => {
        const listeners: Record<string, () => void> = {}
        queueMicrotask(() => listeners.spawn?.())
        return { pid: 4242, exitCode: null, signalCode: null, once: (event: string, fn: () => void) => { listeners[event] = fn }, kill: () => listeners.exit?.() }
    }
}))

const ctx = { name: 'default', cwd: '/repo', runtimeDir: '/run', artifactsDir: '/repo/.wdio/session/default', argv: ['open', 'chrome'], env: {}, platform: 'linux' as const }

const dirs: string[] = []

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

function tauriFixture () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-launch-tauri-'))
    dirs.push(dir)
    const pkg = path.join(dir, 'node_modules', '@wdio', 'tauri-service')
    fs.mkdirSync(pkg, { recursive: true })
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: '@wdio/tauri-service', type: 'module', main: 'index.js' }))
    fs.writeFileSync(path.join(pkg, 'index.js'), 'export {}\n')
    fs.writeFileSync(path.join(dir, 'my-app'), '')
    const bin = path.join(dir, 'bin')
    fs.mkdirSync(bin)
    fs.writeFileSync(path.join(bin, 'tauri-driver'), '')
    fs.chmodSync(path.join(bin, 'tauri-driver'), 0o755)
    return { dir, bin }
}

function fakeBrowser () {
    return { capabilities: {}, deleteSession: vi.fn().mockResolvedValue(undefined) }
}

describe('in-process launch', () => {
    let browser: ReturnType<typeof fakeBrowser>

    beforeEach(() => {
        browser = fakeBrowser()
        remote.mockReset()
        remote.mockResolvedValue(browser)
    })

    it('passes remoteOptions to remote()', async () => {
        const plan = await buildPlan({ target: 'chrome', hostname: 'grid.local', port: 4444 }, ctx)
        const beforeCommand = vi.fn()
        const launched = await launch(plan, { remoteOptions: { beforeCommand, connectionRetryTimeout: 1234 } })

        expect(remote.mock.calls[0][0]).toEqual(expect.objectContaining({ beforeCommand, connectionRetryTimeout: 1234 }))
        await launched.cleanup()
        expect(browser.deleteSession).toHaveBeenCalledTimes(1)
    })

    it('keeps capabilities owned by the plan', async () => {
        const plan = await buildPlan({ target: 'chrome', hostname: 'grid.local', port: 4444 }, ctx)
        const launched = await launch(plan, {
            remoteOptions: {
                // @ts-expect-error capabilities are owned by the plan
                capabilities: { browserName: 'firefox' }
            }
        })

        expect(remote.mock.calls[0][0].capabilities).toBe(plan.capabilities)
        await launched.cleanup()
        expect(browser.deleteSession).toHaveBeenCalledTimes(1)
    })

    it('markResult resolves without calling any provider API for a non-cloud plan', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        try {
            const plan = await buildPlan({ target: 'chrome' }, ctx)
            const launched = await launch(plan)

            await expect(launched.markResult({ passed: true })).resolves.toBeUndefined()
            expect(fetchMock).not.toHaveBeenCalled()
            await launched.cleanup()
        } finally {
            vi.unstubAllGlobals()
        }
    })

    it('calls remote() with the plan remote options and capabilities when no options are given', async () => {
        const plan = await buildPlan({ target: 'chrome', hostname: 'grid.local', port: 4444 }, ctx)
        const launched = await launch(plan)

        expect(remote.mock.calls[0][0]).toEqual({
            ...plan.remote,
            logLevel: 'warn',
            logLevels: SESSION_LOG_LEVELS,
            capabilities: plan.capabilities
        })
        await launched.cleanup()
        expect(browser.deleteSession).toHaveBeenCalledTimes(1)
    })

    it('threads remoteOptions into remote() for a tauri plan whose service has no startWdioSession', async () => {
        const { dir, bin } = tauriFixture()
        const plan = await buildPlan({ target: 'tauri', url: 'my-app' }, { ...ctx, cwd: dir, env: { DISPLAY: ':1', PATH: `${bin}${path.delimiter}${process.env.PATH || ''}` } })
        const beforeCommand = [vi.fn()]
        const launched = await launch(plan, { remoteOptions: { beforeCommand, connectionRetryTimeout: 1234 } })

        expect(remote.mock.calls[0][0]).toEqual(expect.objectContaining({ beforeCommand, connectionRetryTimeout: 1234 }))
        expect(remote.mock.calls[0][0].capabilities).toBe(plan.capabilities)
        await launched.cleanup()
        expect(browser.deleteSession).toHaveBeenCalledTimes(1)
    })

    it('exposes buildPlan and launch from the entry point', () => {
        expect(typeof entry.buildPlan).toBe('function')
        expect(typeof entry.launch).toBe('function')
    })
})

describe('debugger wait', () => {
    const attachCtx = { ...ctx, env: { DISPLAY: ':1' } }
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        remote.mockReset()
        remote.mockResolvedValue(fakeBrowser())
        startDisplayDaemonFromConfig.mockReset()
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it('calls remote() only after /json/version answers', async () => {
        fetchMock
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce({ ok: true })
        const plan = await buildPlan({ target: 'chrome', attach: '9222' }, attachCtx)
        vi.useFakeTimers()
        const launching = launch(plan)
        await vi.runAllTimersAsync()
        const launched = await launching

        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:9222/json/version', expect.objectContaining({ signal: expect.any(AbortSignal) }))
        expect(remote).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.invocationCallOrder[2]).toBeLessThan(remote.mock.invocationCallOrder[0])
        await launched.cleanup()
    })

    it('rejects with the endpoint address and does not call remote() when it never answers', async () => {
        const plan = await buildPlan({ target: 'chrome', attach: '9222' }, attachCtx)
        fetchMock.mockRejectedValue(new TypeError('fetch failed'))
        vi.useFakeTimers()
        const assertion = expect(launch(plan)).rejects.toThrow('localhost:9222')
        await vi.runAllTimersAsync()
        await assertion

        expect(remote).not.toHaveBeenCalled()
    })

    it('stops the display server it started when the debugger never answers', async () => {
        const stop = vi.fn()
        startDisplayDaemonFromConfig.mockResolvedValue({ stop })
        const plan = await buildPlan({ target: 'chrome', attach: '9222' }, attachCtx)
        plan.display = true
        fetchMock.mockRejectedValue(new TypeError('fetch failed'))
        vi.useFakeTimers()
        const assertion = expect(launch(plan)).rejects.toThrow('localhost:9222')
        await vi.runAllTimersAsync()
        await assertion

        expect(stop).toHaveBeenCalledTimes(1)
        expect(remote).not.toHaveBeenCalled()
    })

    it('does not poll the debugger endpoint for a non-attach plan', async () => {
        const plan = await buildPlan({ target: 'chrome' }, attachCtx)
        const launched = await launch(plan)

        expect(fetchMock).not.toHaveBeenCalled()
        await launched.cleanup()
    })
})
