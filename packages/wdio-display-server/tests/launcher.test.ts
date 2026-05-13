import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockShouldRun = vi.hoisted(() => vi.fn())
const mockInit = vi.hoisted(() => vi.fn())
const mockGetDisplayServer = vi.hoisted(() => vi.fn())
const mockStartDaemon = vi.hoisted(() => vi.fn())
const mockStop = vi.hoisted(() => vi.fn())

vi.mock('../src/DisplayServerManager.js', () => ({
    DisplayServerManager: vi.fn(() => ({
        shouldRun: mockShouldRun,
        init: mockInit,
        getDisplayServer: mockGetDisplayServer,
    })),
}))

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    })),
}))

const { default: DisplayServerLauncher } = await import('../src/launcher.js')

describe('DisplayServerLauncher', () => {
    let originalEnv: NodeJS.ProcessEnv
    let createdLaunchers: InstanceType<typeof DisplayServerLauncher>[]

    beforeEach(() => {
        vi.clearAllMocks()
        mockShouldRun.mockReturnValue(true)
        mockInit.mockResolvedValue(true)
        mockStartDaemon.mockResolvedValue({ env: { DISPLAY: ':99' }, stop: mockStop })
        mockStop.mockResolvedValue(undefined)
        mockGetDisplayServer.mockReturnValue({
            name: 'xvfb',
            startDaemon: mockStartDaemon,
        })

        originalEnv = { ...process.env }
        delete process.env.DISPLAY
        delete process.env.WAYLAND_DISPLAY
        createdLaunchers = []
    })

    afterEach(async () => {
        // Drain any signal/exit handlers registered by launchers in this test
        for (const launcher of createdLaunchers) {
            await launcher.onComplete!(0, {} as never, [] as never, {} as never)
        }
        process.env = originalEnv
        vi.restoreAllMocks()
    })

    const makeLauncher = (...args: ConstructorParameters<typeof DisplayServerLauncher>) => {
        const launcher = new DisplayServerLauncher(...args)
        createdLaunchers.push(launcher)
        return launcher
    }

    describe('onPrepare', () => {
        it('starts a daemon and sets DISPLAY on process.env', async () => {
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(mockShouldRun).toHaveBeenCalled()
            expect(mockInit).toHaveBeenCalled()
            expect(mockStartDaemon).toHaveBeenCalled()
            expect(process.env.DISPLAY).toBe(':99')
        })

        it('passes width/height/depth options to startDaemon', async () => {
            const launcher = makeLauncher({ width: 800, height: 600, depth: 16 })
            await launcher.onPrepare!({} as never, [] as never)

            expect(mockStartDaemon).toHaveBeenCalledWith({ width: 800, height: 600, depth: 16 })
        })

        it('no-ops when DISPLAY is already set externally', async () => {
            process.env.DISPLAY = ':42'
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(mockShouldRun).not.toHaveBeenCalled()
            expect(mockStartDaemon).not.toHaveBeenCalled()
            expect(process.env.DISPLAY).toBe(':42')
        })

        it('no-ops when WAYLAND_DISPLAY is already set externally', async () => {
            process.env.WAYLAND_DISPLAY = 'wayland-0'
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(mockStartDaemon).not.toHaveBeenCalled()
        })

        it('no-ops when shouldRun returns false (e.g. enabled=false, non-Linux)', async () => {
            mockShouldRun.mockReturnValue(false)
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(mockInit).not.toHaveBeenCalled()
            expect(mockStartDaemon).not.toHaveBeenCalled()
        })

        it('no-ops when init returns false', async () => {
            mockInit.mockResolvedValue(false)
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(mockStartDaemon).not.toHaveBeenCalled()
        })

        it('no-ops when no display server was selected', async () => {
            mockGetDisplayServer.mockReturnValue(null)
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(mockStartDaemon).not.toHaveBeenCalled()
        })

        it('merges Wayland env vars (WAYLAND_DISPLAY, XDG_RUNTIME_DIR, ELECTRON_OZONE_PLATFORM_HINT)', async () => {
            mockGetDisplayServer.mockReturnValue({ name: 'wayland', startDaemon: mockStartDaemon })
            mockStartDaemon.mockResolvedValue({
                env: {
                    WAYLAND_DISPLAY: 'wayland-1',
                    XDG_RUNTIME_DIR: '/tmp/wdio-wayland-x',
                    ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
                },
                stop: mockStop,
            })

            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(process.env.WAYLAND_DISPLAY).toBe('wayland-1')
            expect(process.env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-wayland-x')
            expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')
        })
    })

    describe('onComplete', () => {
        it('calls daemon.stop()', async () => {
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)
            await launcher.onComplete!(0, {} as never, [] as never, {} as never)

            expect(mockStop).toHaveBeenCalledTimes(1)
        })

        it('is safe to call without a prior onPrepare', async () => {
            const launcher = makeLauncher()
            await expect(
                launcher.onComplete!(0, {} as never, [] as never, {} as never)
            ).resolves.not.toThrow()
            expect(mockStop).not.toHaveBeenCalled()
        })

        it('only stops the daemon once across multiple onComplete calls', async () => {
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)
            await launcher.onComplete!(0, {} as never, [] as never, {} as never)
            await launcher.onComplete!(0, {} as never, [] as never, {} as never)

            expect(mockStop).toHaveBeenCalledTimes(1)
        })
    })

    describe('signal handlers', () => {
        it('triggers daemon.stop() on SIGINT', async () => {
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            process.emit('SIGINT')
            // Allow microtask queue to drain so the void-promise stop() is invoked
            await new Promise((resolve) => setImmediate(resolve))

            expect(mockStop).toHaveBeenCalledTimes(1)

            // Cleanup: prevent dangling 'exit' listener from triggering at test runner exit
            await launcher.onComplete!(0, {} as never, [] as never, {} as never)
        })

        it('does not register signal handlers when onPrepare no-ops', async () => {
            const before = process.listenerCount('SIGINT')
            mockShouldRun.mockReturnValue(false)
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)

            expect(process.listenerCount('SIGINT')).toBe(before)
        })
    })

    describe('env restoration', () => {
        it('restores XDG_RUNTIME_DIR to its pre-existing value after stop', async () => {
            process.env.XDG_RUNTIME_DIR = '/run/user/1000'
            mockGetDisplayServer.mockReturnValue({ name: 'wayland', startDaemon: mockStartDaemon })
            mockStartDaemon.mockResolvedValue({
                env: {
                    WAYLAND_DISPLAY: 'wayland-1',
                    XDG_RUNTIME_DIR: '/tmp/wdio-wayland-x',
                },
                stop: mockStop,
            })

            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)
            expect(process.env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-wayland-x')

            await launcher.onComplete!(0, {} as never, [] as never, {} as never)
            expect(process.env.XDG_RUNTIME_DIR).toBe('/run/user/1000')
        })

        it('deletes daemon-only env keys that had no prior value after stop', async () => {
            // Pre-state: no WAYLAND_DISPLAY set
            delete process.env.WAYLAND_DISPLAY
            mockGetDisplayServer.mockReturnValue({ name: 'wayland', startDaemon: mockStartDaemon })
            mockStartDaemon.mockResolvedValue({
                env: { WAYLAND_DISPLAY: 'wayland-1' },
                stop: mockStop,
            })

            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)
            expect(process.env.WAYLAND_DISPLAY).toBe('wayland-1')

            await launcher.onComplete!(0, {} as never, [] as never, {} as never)
            expect('WAYLAND_DISPLAY' in process.env).toBe(false)
        })

        it('restores all keys when the daemon sets multiple env vars on top of existing ones', async () => {
            process.env.XDG_RUNTIME_DIR = '/run/user/1000'
            process.env.ELECTRON_OZONE_PLATFORM_HINT = 'x11'
            delete process.env.WAYLAND_DISPLAY

            mockGetDisplayServer.mockReturnValue({ name: 'wayland', startDaemon: mockStartDaemon })
            mockStartDaemon.mockResolvedValue({
                env: {
                    WAYLAND_DISPLAY: 'wayland-1',
                    XDG_RUNTIME_DIR: '/tmp/wdio-wayland-x',
                    ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
                },
                stop: mockStop,
            })

            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)
            await launcher.onComplete!(0, {} as never, [] as never, {} as never)

            expect(process.env.XDG_RUNTIME_DIR).toBe('/run/user/1000')
            expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('x11')
            expect('WAYLAND_DISPLAY' in process.env).toBe(false)
        })

        it('clears DISPLAY when Xvfb daemon stops and DISPLAY had no prior value', async () => {
            delete process.env.DISPLAY
            const launcher = makeLauncher()
            await launcher.onPrepare!({} as never, [] as never)
            expect(process.env.DISPLAY).toBe(':99')

            await launcher.onComplete!(0, {} as never, [] as never, {} as never)
            expect('DISPLAY' in process.env).toBe(false)
        })
    })

    describe('option aliases', () => {
        it('accepts legacy autoXvfb option (passed through to manager)', () => {
            // The manager mock receives the options; we just verify construction succeeds.
            expect(() => new DisplayServerLauncher({ autoXvfb: false })).not.toThrow()
        })
    })
})
