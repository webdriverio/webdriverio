import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import type * as DisplayServerManagerModule from '../src/DisplayServerManager.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/DisplayServerManager.js', async (importOriginal) => ({
    ...await importOriginal<typeof DisplayServerManagerModule>(),
    DisplayServerManager: vi.fn(function () { return { startDaemon: async () => null } }),
}))

const { DisplayServerManager, optionsFromConfig } = await import('../src/DisplayServerManager.js')
const { startDisplayDaemonFromConfig } = await import('../src/daemon.js')

describe('startDisplayDaemonFromConfig', () => {
    beforeEach(() => {
        vi.mocked(DisplayServerManager).mockClear()
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('builds its manager from the config', async () => {
        vi.stubEnv('DISPLAY', undefined)
        vi.stubEnv('WAYLAND_DISPLAY', undefined)
        const config = { displayServer: 'wayland', displayServerAutoInstall: true } as const

        await startDisplayDaemonFromConfig(config)

        expect(DisplayServerManager).toHaveBeenCalledWith(optionsFromConfig(config))
    })

    describe('with an existing Wayland display', () => {
        beforeEach(() => {
            vi.stubEnv('DISPLAY', undefined)
            vi.stubEnv('WAYLAND_DISPLAY', 'wayland-1')
            vi.stubEnv('GDK_BACKEND', undefined)
            vi.stubEnv('XDG_SESSION_TYPE', undefined)
            vi.stubEnv('ELECTRON_OZONE_PLATFORM_HINT', undefined)
        })

        it('sets the Wayland session env over any other value and restores it on stop', async () => {
            vi.stubEnv('GDK_BACKEND', 'x11')
            vi.stubEnv('XDG_SESSION_TYPE', 'tty')

            const running = await startDisplayDaemonFromConfig({})

            expect(process.env.GDK_BACKEND).toBe('wayland')
            expect(process.env.XDG_SESSION_TYPE).toBe('wayland')
            expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')
            await running?.stop()
            expect(process.env.GDK_BACKEND).toBe('x11')
            expect(process.env.XDG_SESSION_TYPE).toBe('tty')
            expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBeUndefined()
        })

        it('changes nothing when DISPLAY is set too', async () => {
            vi.stubEnv('DISPLAY', ':0')

            expect(await startDisplayDaemonFromConfig({})).toBeNull()
            expect(process.env.XDG_SESSION_TYPE).toBeUndefined()
        })
    })
})
