import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DisplayDaemon } from '../src/types.js'
import { installStubOnPath } from './realprocess-helpers.js'

const warn = vi.hoisted(() => vi.fn())
vi.mock('@wdio/logger', () => ({
    default: () => ({ info: vi.fn(), error: vi.fn(), warn, debug: vi.fn() }),
}))

const { DisplayServerManager } = await import('../src/DisplayServerManager.js')

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

describe.skipIf(process.platform === 'win32')('DisplayServerManager (real process fallback)', () => {
    const uninstall: Array<() => Promise<void>> = []
    let daemon: DisplayDaemon | null = null

    beforeAll(async () => {
        uninstall.push(await installStubOnPath('weston', path.join(fixtures, 'wayland-daemon-stub.mjs'), { WDIO_STUB_MODE: 'crash' }))
        uninstall.push(await installStubOnPath('Xvfb', path.join(fixtures, 'xvfb-daemon-stub.mjs')))
    })

    afterAll(async () => {
        for (const dispose of uninstall.reverse()) {
            await dispose()
        }
    })

    afterEach(() => {
        daemon?.stopSync()
        daemon = null
    })

    it('starts Xvfb when Weston crashes on startup', async () => {
        const manager = new DisplayServerManager({ force: true })

        daemon = await manager.startDaemon({ width: 100, height: 100 })

        expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^wayland failed to start: Weston process exited unexpectedly[\s\S]*simulated startup failure/))
        expect(daemon?.env.DISPLAY).toBe(':107')
        expect(manager.getDisplayServer()?.name).toBe('xvfb')
    }, 15_000)
})
