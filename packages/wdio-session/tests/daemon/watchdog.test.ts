import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { startWatchdog } from '../../src/daemon/watchdog.js'
import { Session } from '../../src/session.js'
import type { OpenPlan } from '../../src/types.js'

const dirs: string[] = []
afterEach(() => {
    vi.useRealTimers()
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

function session (browser: Record<string, unknown>) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-watchdog-'))
    dirs.push(dir)
    return new Session({
        name: 'test',
        cwd: dir,
        artifactsDir: path.join(dir, 'artifacts'),
        runtimeDir: dir,
        browser: browser as unknown as WebdriverIO.Browser,
        plan: { applies: ['W'], platform: 'browser', label: 'Chrome', capabilities: {} } as unknown as OpenPlan,
        persistHistory: false
    })
}

const tick = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms)
}

describe('watchdog', () => {
    it('keeps the session when one ping fails', async () => {
        vi.useFakeTimers()
        const getWindowHandles = vi.fn()
            .mockRejectedValueOnce(new Error('chrome not reachable'))
            .mockResolvedValue(['a'])
        const onDead = vi.fn()
        startWatchdog(session({ getWindowHandles }), { pids: () => [] }, { busy: false }, onDead, 100)
        await tick(350)
        expect(getWindowHandles.mock.calls.length).toBeGreaterThanOrEqual(3)
        expect(onDead).not.toHaveBeenCalled()
    })

    it('ends the session when two pings in a row fail', async () => {
        vi.useFakeTimers()
        const getWindowHandles = vi.fn().mockRejectedValue(new Error('chrome not reachable'))
        const onDead = vi.fn()
        startWatchdog(session({ getWindowHandles }), { pids: () => [] }, { busy: false }, onDead, 100)
        await tick(250)
        expect(onDead).toHaveBeenCalledTimes(1)
    })

    it('does not count a discarded frame as a dead session', async () => {
        vi.useFakeTimers()
        const getWindowHandles = vi.fn().mockRejectedValue(new Error('no such frame: browsing context has been discarded'))
        const onDead = vi.fn()
        startWatchdog(session({ getWindowHandles }), { pids: () => [] }, { busy: false }, onDead, 100)
        await tick(550)
        expect(onDead).not.toHaveBeenCalled()
    })

    it('ends the session right away when the browser process exits', async () => {
        vi.useFakeTimers()
        const onDead = vi.fn()
        startWatchdog(session({ getWindowHandles: vi.fn() }), { pids: () => [2 ** 22 + 12345] }, { busy: false }, onDead, 100)
        await tick(150)
        expect(onDead).toHaveBeenCalledTimes(1)
    })
})

describe('a frame or page that went away during an action', () => {
    it('reports it and returns to the top document instead of ending the session', async () => {
        process.env.WDIO_SESSION_CHANGES = '0'
        try {
            const s = session({
                back: vi.fn().mockRejectedValue(new Error('no such frame: browsing context has been discarded')),
                getWindowHandle: vi.fn().mockResolvedValue('top')
            })
            const onShutdown = vi.fn()
            s.onShutdown = onShutdown
            s.set('activeContext', { contextId: 'frame-1' })
            s.set('frame', 'e4')
            const err = await s.dispatch({ action: 'back', args: {}, cwd: s.cwd }).catch((e) => e)
            expect(err.code).toBe('CONTEXT_GONE')
            expect(err.message).toContain('The frame went away')
            expect(s.get('activeContext')).toBeUndefined()
            expect(s.get('frame')).toBeUndefined()
            await new Promise((resolve) => setTimeout(resolve, 80))
            expect(onShutdown).not.toHaveBeenCalled()
        } finally {
            delete process.env.WDIO_SESSION_CHANGES
        }
    })
})
