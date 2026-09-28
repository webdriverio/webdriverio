import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DisplayDaemon } from '../src/types.js'
import { installStubOnPath } from './realprocess-helpers.js'

vi.mock('@wdio/logger', () => ({
    default: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}))

const { XvfbDisplayServer } = await import('../src/XvfbDisplayServer.js')

const stubPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'xvfb-daemon-stub.mjs')

describe.skipIf(process.platform === 'win32')('XvfbDisplayServer (real process lifecycle)', () => {
    let uninstall: () => Promise<void>
    let daemon: DisplayDaemon | undefined

    beforeAll(async () => {
        uninstall = await installStubOnPath('Xvfb', stubPath)
    })

    afterAll(() => uninstall?.())

    afterEach(() => {
        daemon?.stopSync()
        daemon = undefined
        delete process.env.WDIO_STUB_MODE
    })

    it('reads the display number a real child writes to fd 3, then stop() tears it down', async () => {
        daemon = await new XvfbDisplayServer().startDaemon({ width: 100, height: 100 })

        expect(daemon.env.DISPLAY).toBe(':107')
        expect(daemon.env.GDK_BACKEND).toBe('x11')

        await daemon.stop()
        daemon = undefined
    }, 15_000)

    it('rejects with the captured stderr when the child crashes before reporting a display', async () => {
        process.env.WDIO_STUB_MODE = 'crash'

        await expect(new XvfbDisplayServer().startDaemon({ width: 100, height: 100 }))
            .rejects.toThrow(/Xvfb process exited unexpectedly[\s\S]*simulated startup failure/)
    }, 15_000)
})
