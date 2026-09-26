import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

const mockPlatform = vi.hoisted(() => vi.fn(() => 'linux'))
const mockWayland = vi.hoisted(() => ({
    name: 'wayland' as const,
    isAvailable: vi.fn(),
    install: vi.fn(),
    startDaemon: vi.fn(),
}))
const mockXvfb = vi.hoisted(() => ({
    name: 'xvfb' as const,
    isAvailable: vi.fn(),
    install: vi.fn(),
    startDaemon: vi.fn(),
}))

vi.mock('node:os', () => ({
    default: { platform: mockPlatform },
}))

vi.mock('../src/WaylandDisplayServer.js', () => ({
    WaylandDisplayServer: vi.fn(function () { return mockWayland }),
}))

vi.mock('../src/XvfbDisplayServer.js', () => ({
    XvfbDisplayServer: vi.fn(function () { return mockXvfb }),
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const { DisplayServerManager, optionsFromConfig } = await import('../src/DisplayServerManager.js')

describe('DisplayServerManager (gap coverage)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockPlatform.mockReturnValue('linux')
        delete process.env.DISPLAY
        delete process.env.WAYLAND_DISPLAY
        // Defaults: nothing available unless a test overrides
        mockWayland.isAvailable.mockResolvedValue(false)
        mockXvfb.isAvailable.mockResolvedValue(false)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('auto-fallback', () => {
        it('prefers Wayland when available in auto mode', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'auto' })

            const ok = await mgr.init()

            expect(ok).toBe(true)
            expect(mgr.getDisplayServer()?.name).toBe('wayland')
            // Should not even probe Xvfb when Wayland is found first
            expect(mockXvfb.isAvailable).not.toHaveBeenCalled()
        })

        it('is idempotent: a second init() does not re-select or overwrite the display server', async () => {
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'xvfb' })

            expect(await mgr.init()).toBe(true)
            const selected = mgr.getDisplayServer()
            expect(mockXvfb.isAvailable).toHaveBeenCalledTimes(1)

            expect(await mgr.init()).toBe(true)
            expect(mockXvfb.isAvailable).toHaveBeenCalledTimes(1)
            expect(mgr.getDisplayServer()).toBe(selected)
        })

        it('falls back to Xvfb when Wayland is unavailable', async () => {
            mockWayland.isAvailable.mockResolvedValue(false)
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'auto' })

            const ok = await mgr.init()

            expect(ok).toBe(true)
            expect(mgr.getDisplayServer()?.name).toBe('xvfb')
        })

        it('returns false when neither Wayland nor Xvfb is available and autoInstall is off', async () => {
            const mgr = new DisplayServerManager({ displayServer: 'auto' })

            const ok = await mgr.init()

            expect(ok).toBe(false)
            expect(mgr.getDisplayServer()).toBeNull()
        })

        it('auto-installs Wayland in auto mode when missing and autoInstall is enabled', async () => {
            mockWayland.isAvailable.mockResolvedValue(false)
            mockWayland.install.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'auto', autoInstall: true, autoInstallMode: 'root' })

            const ok = await mgr.init()

            expect(ok).toBe(true)
            expect(mockWayland.install).toHaveBeenCalledWith({ mode: 'root', command: undefined })
            expect(mgr.getDisplayServer()?.name).toBe('wayland')
        })

        it('falls through to Xvfb install when Wayland install fails', async () => {
            mockWayland.isAvailable.mockResolvedValue(false)
            mockWayland.install.mockResolvedValue(false)
            mockXvfb.isAvailable.mockResolvedValue(false)
            mockXvfb.install.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'auto', autoInstall: true, autoInstallMode: 'root' })

            const ok = await mgr.init()

            expect(ok).toBe(true)
            expect(mockWayland.install).toHaveBeenCalled()
            expect(mockXvfb.install).toHaveBeenCalled()
            expect(mgr.getDisplayServer()?.name).toBe('xvfb')
        })

        it('forwards a custom autoInstallCommand to install()', async () => {
            mockWayland.isAvailable.mockResolvedValue(false)
            mockWayland.install.mockResolvedValue(true)
            const mgr = new DisplayServerManager({
                displayServer: 'wayland',
                autoInstall: true,
                autoInstallMode: 'sudo',
                autoInstallCommand: ['my', 'install', 'command'],
            })

            await mgr.init()

            expect(mockWayland.install).toHaveBeenCalledWith({
                mode: 'sudo',
                command: ['my', 'install', 'command'],
            })
        })
    })

    describe('shouldRun', () => {
        it('returns false on Linux when only WAYLAND_DISPLAY is set', () => {
            process.env.WAYLAND_DISPLAY = 'wayland-0'
            try {
                expect(new DisplayServerManager().shouldRun()).toBe(false)
            } finally {
                delete process.env.WAYLAND_DISPLAY
            }
        })
    })

    describe('forced preference', () => {
        it('returns null when the requested display server is unavailable and autoInstall is off', async () => {
            mockWayland.isAvailable.mockResolvedValue(false)
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })

            const ok = await mgr.init()

            expect(ok).toBe(false)
            expect(mockXvfb.isAvailable).not.toHaveBeenCalled()
        })

        it('does not probe Wayland when displayServer: "xvfb"', async () => {
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'xvfb' })

            await mgr.init()

            expect(mockWayland.isAvailable).not.toHaveBeenCalled()
        })
    })
})

describe('optionsFromConfig', () => {
    it('maps all new displayServer* config keys to their option names', () => {
        const result = optionsFromConfig({
            displayServerEnabled: false,
            displayServer: 'wayland',
            displayServerAutoInstall: true,
            displayServerAutoInstallMode: 'sudo',
            displayServerAutoInstallCommand: 'custom-cmd',
        })

        expect(result).toMatchObject({
            enabled: false,
            displayServer: 'wayland',
            autoInstall: true,
            autoInstallMode: 'sudo',
            autoInstallCommand: 'custom-cmd',
        })
    })

    it('returns undefined values for keys absent from the config (DisplayServerManager fills defaults)', () => {
        const result = optionsFromConfig({})

        expect(result.enabled).toBeUndefined()
        expect(result.displayServer).toBeUndefined()
        expect(result.autoInstall).toBeUndefined()
    })
})
