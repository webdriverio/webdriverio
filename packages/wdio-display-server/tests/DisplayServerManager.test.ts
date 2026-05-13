import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockPlatform = vi.hoisted(() => vi.fn(() => 'linux'))
const mockWayland = vi.hoisted(() => ({
    name: 'wayland' as const,
    isAvailable: vi.fn(),
    install: vi.fn(),
    getEnvironment: vi.fn(() => ({})),
    getProcessWrapper: vi.fn(() => null),
    getChromeFlags: vi.fn(() => ['--ozone-platform=wayland', '--enable-features=UseOzonePlatform']),
    startDaemon: vi.fn(),
}))
const mockXvfb = vi.hoisted(() => ({
    name: 'xvfb' as const,
    isAvailable: vi.fn(),
    install: vi.fn(),
    getEnvironment: vi.fn(() => ({})),
    getProcessWrapper: vi.fn(() => ['xvfb-run', '--auto-servernum', '--']),
    getChromeFlags: vi.fn(() => []),
    startDaemon: vi.fn(),
}))

vi.mock('node:os', () => ({
    default: { platform: mockPlatform },
}))

vi.mock('../src/WaylandDisplayServer.js', () => ({
    WaylandDisplayServer: vi.fn(() => mockWayland),
}))

vi.mock('../src/XvfbDisplayServer.js', () => ({
    XvfbDisplayServer: vi.fn(() => mockXvfb),
}))

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    })),
}))

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

    describe('shouldRun #initialized gate', () => {
        it('returns true after init() once a display server is active, even with DISPLAY set later', async () => {
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'xvfb' })

            await mgr.init()

            // Even after a child process or daemon sets DISPLAY, shouldRun stays true
            process.env.DISPLAY = ':99'
            expect(mgr.shouldRun()).toBe(true)
        })

        it('returns false after init() if the manager was disabled (initialized but disabled)', async () => {
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'xvfb', enabled: false })

            await mgr.init() // returns false; no init actually performed

            expect(mgr.shouldRun()).toBe(false)
        })
    })

    describe('injectDisplayFlags (per-worker)', () => {
        it('does nothing when no display server is active', () => {
            const mgr = new DisplayServerManager()
            const caps = { 'goog:chromeOptions': { args: [] } } as WebdriverIO.Capabilities

            mgr.injectDisplayFlags(caps as never)

            expect(caps['goog:chromeOptions']!.args).toEqual([])
        })

        it('injects Wayland flags when WAYLAND_DISPLAY is set externally (launcher pre-set, this manager did not init)', () => {
            // Reproduces the launcher-service interaction: DisplayServerLauncher
            // ran in onPrepare and set process.env.WAYLAND_DISPLAY; this manager's
            // own init() short-circuited (shouldRun = false because env is set),
            // so #displayServer is null. Workers must still receive ozone-wayland
            // flags so Chrome doesn't fall back to absent X11.
            process.env.WAYLAND_DISPLAY = 'wayland-1'
            try {
                const mgr = new DisplayServerManager()
                const caps = { browserName: 'chrome' } as WebdriverIO.Capabilities

                mgr.injectDisplayFlags(caps as never)

                expect(caps['goog:chromeOptions']?.args).toEqual([
                    '--ozone-platform=wayland',
                    '--enable-features=UseOzonePlatform',
                ])
            } finally {
                delete process.env.WAYLAND_DISPLAY
            }
        })

        it('does nothing for Xvfb (no Chrome flags needed)', async () => {
            mockXvfb.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'xvfb' })
            await mgr.init()

            const caps = { 'goog:chromeOptions': { args: [] } } as WebdriverIO.Capabilities
            mgr.injectDisplayFlags(caps as never)

            expect(caps['goog:chromeOptions']!.args).toEqual([])
        })

        it('appends Wayland Chrome flags to single-capability args', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })
            await mgr.init()

            const caps = { 'goog:chromeOptions': { args: ['--disable-gpu'] } } as WebdriverIO.Capabilities
            mgr.injectDisplayFlags(caps as never)

            expect(caps['goog:chromeOptions']!.args).toEqual([
                '--disable-gpu',
                '--ozone-platform=wayland',
                '--enable-features=UseOzonePlatform',
            ])
        })

        it('creates goog:chromeOptions for bare `browserName: chrome` capabilities', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })
            await mgr.init()

            const caps = { browserName: 'chrome' } as WebdriverIO.Capabilities
            mgr.injectDisplayFlags(caps as never)

            expect(caps['goog:chromeOptions']?.args).toEqual([
                '--ozone-platform=wayland',
                '--enable-features=UseOzonePlatform',
            ])
        })

        it('does not duplicate Wayland flags when already present', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })
            await mgr.init()

            const caps = {
                'goog:chromeOptions': {
                    args: ['--ozone-platform=wayland', '--enable-features=UseOzonePlatform'],
                },
            } as WebdriverIO.Capabilities

            mgr.injectDisplayFlags(caps as never)

            expect(caps['goog:chromeOptions']!.args).toEqual([
                '--ozone-platform=wayland',
                '--enable-features=UseOzonePlatform',
            ])
        })

        it('injects Wayland flags into Edge capabilities', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })
            await mgr.init()

            const caps = { browserName: 'msedge' } as WebdriverIO.Capabilities
            mgr.injectDisplayFlags(caps as never)

            expect(caps['ms:edgeOptions']?.args).toEqual([
                '--ozone-platform=wayland',
                '--enable-features=UseOzonePlatform',
            ])
        })

        it('injects Wayland flags into every browser in a multiremote config', async () => {
            mockWayland.isAvailable.mockResolvedValue(true)
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })
            await mgr.init()

            const caps = {
                browserA: { capabilities: { browserName: 'chrome' } as WebdriverIO.Capabilities },
                browserB: { capabilities: { 'goog:chromeOptions': { args: ['--disable-gpu'] } } as WebdriverIO.Capabilities },
            }
            mgr.injectDisplayFlags(caps as never)

            const a = caps.browserA.capabilities as WebdriverIO.Capabilities
            const b = caps.browserB.capabilities as WebdriverIO.Capabilities
            expect(a['goog:chromeOptions']?.args).toContain('--ozone-platform=wayland')
            expect(b['goog:chromeOptions']?.args).toEqual([
                '--disable-gpu',
                '--ozone-platform=wayland',
                '--enable-features=UseOzonePlatform',
            ])
        })
    })

    describe('forced preference', () => {
        it('returns null when the requested display server is unavailable and autoInstall is off', async () => {
            mockWayland.isAvailable.mockResolvedValue(false)
            const mgr = new DisplayServerManager({ displayServer: 'wayland' })

            const ok = await mgr.init()

            expect(ok).toBe(false)
            // Must not have probed xvfb
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
            displayServerMaxRetries: 5,
            displayServerRetryDelay: 2000,
        } as never)

        expect(result).toMatchObject({
            enabled: false,
            displayServer: 'wayland',
            autoInstall: true,
            autoInstallMode: 'sudo',
            autoInstallCommand: 'custom-cmd',
            maxRetries: 5,
            retryDelay: 2000,
        })
    })

    it('forwards legacy xvfb* / autoXvfb aliases unchanged so the manager can apply precedence', () => {
        const result = optionsFromConfig({
            autoXvfb: false,
            xvfbAutoInstall: 'sudo',
            xvfbAutoInstallMode: 'root',
            xvfbAutoInstallCommand: ['my', 'cmd'],
            xvfbMaxRetries: 7,
            xvfbRetryDelay: 500,
        } as never)

        expect(result).toMatchObject({
            autoXvfb: false,
            xvfbAutoInstall: 'sudo',
            xvfbAutoInstallMode: 'root',
            xvfbAutoInstallCommand: ['my', 'cmd'],
            xvfbMaxRetries: 7,
            xvfbRetryDelay: 500,
        })
    })

    it('returns undefined values for keys absent from the config (DisplayServerManager fills defaults)', () => {
        const result = optionsFromConfig({} as never)

        // None of the option keys should throw on access; their values are undefined.
        expect(result.enabled).toBeUndefined()
        expect(result.displayServer).toBeUndefined()
        expect(result.autoInstall).toBeUndefined()
        expect(result.maxRetries).toBeUndefined()
        expect(result.xvfbAutoInstall).toBeUndefined()
    })
})
