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
const { default: logger } = await import('@wdio/logger')

// A successful install makes the server available, as a real package install would.
const installsOk = (server: typeof mockWayland | typeof mockXvfb) => server.install.mockImplementation(async () => {
    server.isAvailable.mockResolvedValue(true)
    return true
})

describe('DisplayServerManager (gap coverage)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockPlatform.mockReturnValue('linux')
        delete process.env.DISPLAY
        delete process.env.WAYLAND_DISPLAY
        // Defaults: nothing available or installable unless a test overrides
        mockWayland.isAvailable.mockResolvedValue(false)
        mockXvfb.isAvailable.mockResolvedValue(false)
        mockWayland.install.mockResolvedValue(false)
        mockXvfb.install.mockResolvedValue(false)
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
            expect(mockXvfb.isAvailable).not.toHaveBeenCalled()
        })

        it('uses an installed Xvfb rather than installing Weston over it', async () => {
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'auto', autoInstall: true })

            expect(await mgr.init()).toBe(true)

            expect(mgr.getDisplayServer()?.name).toBe('xvfb')
            expect(mockWayland.install).not.toHaveBeenCalled()
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
            installsOk(mockWayland)
            const mgr = new DisplayServerManager({ displayServer: 'auto', autoInstall: true, autoInstallMode: 'root' })

            const ok = await mgr.init()

            expect(ok).toBe(true)
            expect(mockWayland.install).toHaveBeenCalledWith({ mode: 'root', command: undefined })
            expect(mgr.getDisplayServer()?.name).toBe('wayland')
        })

        it('falls through to Xvfb install when Wayland install fails', async () => {
            installsOk(mockXvfb)
            const mgr = new DisplayServerManager({ displayServer: 'auto', autoInstall: true, autoInstallMode: 'root' })

            const ok = await mgr.init()

            expect(ok).toBe(true)
            expect(mockWayland.install).toHaveBeenCalled()
            expect(mockXvfb.install).toHaveBeenCalled()
            expect(mgr.getDisplayServer()?.name).toBe('xvfb')
        })

        it('starts Xvfb without rerunning an install command that installed Xvfb on the Weston attempt', async () => {
            mockWayland.install.mockImplementation(async () => {
                mockXvfb.isAvailable.mockResolvedValue(true)
                return true
            })
            const mgr = new DisplayServerManager({ autoInstall: true, autoInstallCommand: 'apt-get install -y xvfb' })

            expect(await mgr.init()).toBe(true)
            expect(mgr.getDisplayServer()?.name).toBe('xvfb')
            expect(mockXvfb.install).not.toHaveBeenCalled()
            expect(vi.mocked(logger('@wdio/display-server').warn)).toHaveBeenCalledWith('wayland still not found after installing')
        })

        it('warns about each missing server when auto-install is off', async () => {
            const mgr = new DisplayServerManager()

            expect(await mgr.init()).toBe(false)
            const warn = vi.mocked(logger('@wdio/display-server').warn)
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^wayland not found/))
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^xvfb not found/))
        })

        it('forwards a custom autoInstallCommand to install()', async () => {
            installsOk(mockWayland)
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

    describe('startDaemon', () => {
        const daemon = { env: { DISPLAY: ':0' }, stop: vi.fn(), stopSync: vi.fn() }

        it('falls back to Xvfb when Weston fails to start', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            mockXvfb.isAvailable.mockResolvedValue(true)
            mockWayland.startDaemon.mockRejectedValueOnce(new Error('Weston process exited unexpectedly'))
            mockXvfb.startDaemon.mockResolvedValueOnce(daemon)
            const mgr = new DisplayServerManager()

            expect(await mgr.startDaemon()).toBe(daemon)

            expect(mgr.getDisplayServer()?.name).toBe('xvfb')
        })

        it('returns null when no candidate starts', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            mockXvfb.isAvailable.mockResolvedValue(true)
            mockWayland.startDaemon.mockRejectedValueOnce(new Error('weston failed'))
            mockXvfb.startDaemon.mockRejectedValueOnce(new Error('Xvfb failed'))
            const mgr = new DisplayServerManager()

            expect(await mgr.startDaemon()).toBeNull()
            expect(mgr.getDisplayServer()).toBeNull()
        })

        it('installs Xvfb when the installed Weston fails to start', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            mockWayland.startDaemon.mockRejectedValueOnce(new Error('weston failed'))
            installsOk(mockXvfb)
            mockXvfb.startDaemon.mockResolvedValueOnce(daemon)
            const mgr = new DisplayServerManager({ autoInstall: true })

            expect(await mgr.startDaemon()).toBe(daemon)
            expect(mgr.getDisplayServer()?.name).toBe('xvfb')
            expect(mockWayland.install).not.toHaveBeenCalled()
        })

        it('starts nothing when the manager is disabled', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ enabled: false })

            expect(await mgr.startDaemon()).toBeNull()
            expect(mockWayland.startDaemon).not.toHaveBeenCalled()
        })

        it('does not fall back from an explicit preference', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            mockXvfb.isAvailable.mockResolvedValue(true)
            mockWayland.startDaemon.mockRejectedValueOnce(new Error('weston failed'))
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })

            expect(await mgr.startDaemon()).toBeNull()
            expect(mockXvfb.startDaemon).not.toHaveBeenCalled()
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

    describe('deprecated xvfb* keys', () => {
        const warn = vi.mocked(logger('@wdio/display-server').warn)
        const see = ' See https://webdriver.io/docs/v10-migration#virtual-displays-on-linux'
        beforeEach(() => warn.mockClear())

        it('maps each key and warns naming its replacement', () => {
            const result = optionsFromConfig({
                autoXvfb: true,
                xvfbAutoInstall: true,
                xvfbAutoInstallMode: 'root',
                xvfbAutoInstallCommand: 'custom-cmd',
            } as never)

            expect(result).toMatchObject({
                enabled: true,
                displayServer: 'xvfb',
                autoInstall: true,
                autoInstallMode: 'root',
                autoInstallCommand: 'custom-cmd',
            })
            expect(warn.mock.calls).toEqual([
                ['`autoXvfb` is deprecated, use `displayServerEnabled` instead.' + see],
                ['`xvfbAutoInstall` is deprecated, use `displayServerAutoInstall` instead.' + see],
                ['`xvfbAutoInstallMode` is deprecated, use `displayServerAutoInstallMode` instead.' + see],
                ['`xvfbAutoInstallCommand` is deprecated, use `displayServerAutoInstallCommand` instead.' + see],
                ['Preferring Xvfb, as v9 did, because the config sets v9 display keys; set `displayServer` to choose.' + see],
            ])
        })

        it('does not mention Xvfb when `autoXvfb: false` turns the display server off', () => {
            optionsFromConfig({ autoXvfb: false } as never)

            expect(warn.mock.calls).toEqual([['`autoXvfb` is deprecated, use `displayServerEnabled` instead.' + see]])
        })

        it('prefers the displayServer* key when both are set, and does not pin Xvfb', () => {
            const result = optionsFromConfig({
                displayServerEnabled: false,
                autoXvfb: true,
                displayServerAutoInstall: false,
                xvfbAutoInstall: true,
                displayServerAutoInstallMode: 'root',
                xvfbAutoInstallMode: 'sudo',
                displayServerAutoInstallCommand: 'new-cmd',
                xvfbAutoInstallCommand: 'old-cmd',
            } as never)

            expect(result).toMatchObject({
                enabled: false,
                autoInstall: false,
                autoInstallMode: 'root',
                autoInstallCommand: 'new-cmd',
            })
            expect(result.displayServer).toBeUndefined()
        })

        it('warns that the retry keys have no effect', () => {
            optionsFromConfig({ xvfbMaxRetries: 5, xvfbRetryDelay: 1500 } as never)

            expect(warn.mock.calls).toEqual([
                ['`xvfbMaxRetries` is deprecated and has no effect, since display-server startup is not retried.' + see],
                ['`xvfbRetryDelay` is deprecated and has no effect, since display-server startup is not retried.' + see],
            ])
        })

        it('does not warn for a config without them', () => {
            optionsFromConfig({ displayServerEnabled: false } as never)

            expect(warn).not.toHaveBeenCalled()
        })
    })
})
