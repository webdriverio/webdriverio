import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockSpawn = vi.hoisted(() => vi.fn())
const mockAccess = vi.hoisted(() => vi.fn())
const mockMkdir = vi.hoisted(() => vi.fn())
const mockRm = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    execFile: vi.fn(),
    spawn: mockSpawn,
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync),
}))

const mockRmSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', () => ({
    rmSync: mockRmSync,
}))

vi.mock('node:fs/promises', () => ({
    access: mockAccess,
    mkdir: mockMkdir,
    rm: mockRm,
}))

// `detectPackageManager` (used by installViaPackageManager) probes
// `which apt-get`, `which dnf`, ... via execAsync. This helper queues
// rejections for the package managers checked before the target, then a
// resolution for the target. Tests using install() can call this to put the
// detection in a deterministic state.
const PM_PROBE_ORDER = ['apt-get', 'dnf', 'yum', 'zypper', 'pacman', 'apk', 'xbps-install']
const PM_NAME_TO_CMD: Record<string, string> = {
    apt: 'apt-get', dnf: 'dnf', yum: 'yum', zypper: 'zypper',
    pacman: 'pacman', apk: 'apk', xbps: 'xbps-install',
}
function queuePackageManagerDetection(pm: string) {
    if (pm === 'unknown') {
        for (let i = 0; i < PM_PROBE_ORDER.length; i++) {
            mockExecAsync.mockRejectedValueOnce(new Error('not found'))
        }
        return
    }
    const target = PM_NAME_TO_CMD[pm]
    const targetIdx = PM_PROBE_ORDER.indexOf(target)
    for (let i = 0; i < targetIdx; i++) {
        mockExecAsync.mockRejectedValueOnce(new Error('not found'))
    }
    mockExecAsync.mockResolvedValueOnce({ stdout: `/usr/bin/${target}`, stderr: '' })
}

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    })),
}))

const { WaylandDisplayServer } = await import('../src/WaylandDisplayServer.js')

class FakeProc extends EventEmitter {
    killed = false
    exitCode: number | null = null
    signalCode: NodeJS.Signals | null = null
    kill = vi.fn((_signal?: NodeJS.Signals) => {
        this.killed = true
        return true
    })
    removeListener = (event: string, listener: (...args: any[]) => void) => {
        super.removeListener(event, listener)
        return this
    }
}

describe('WaylandDisplayServer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockMkdir.mockResolvedValue(undefined)
        mockRm.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('isAvailable', () => {
        it('returns true when weston is on PATH', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/weston', stderr: '' })
            const server = new WaylandDisplayServer()

            expect(await server.isAvailable()).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('which weston')
        })

        it('returns false when weston is not on PATH', async () => {
            mockExecAsync.mockRejectedValueOnce(new Error('not found'))
            const server = new WaylandDisplayServer()

            expect(await server.isAvailable()).toBe(false)
        })
    })

    describe('getEnvironment', () => {
        it('returns empty object (env is per-daemon)', () => {
            const server = new WaylandDisplayServer()
            expect(server.getEnvironment()).toEqual({})
        })
    })

    describe('getProcessWrapper', () => {
        it('returns null (weston cannot wrap a child without breaking IPC)', () => {
            const server = new WaylandDisplayServer()
            expect(server.getProcessWrapper()).toBeNull()
        })
    })

    describe('getChromeFlags', () => {
        it('returns the Ozone Wayland flags', () => {
            const server = new WaylandDisplayServer()
            expect(server.getChromeFlags()).toEqual([
                '--ozone-platform=wayland',
                '--enable-features=UseOzonePlatform',
            ])
        })
    })

    describe('install', () => {
        it('uses the custom string command verbatim when provided', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })
            const server = new WaylandDisplayServer()

            const result = await server.install({ command: 'my-custom-install' })

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('my-custom-install', { timeout: 240000 })
            // Custom command short-circuits before package-manager detection.
            expect(mockExecAsync).not.toHaveBeenCalledWith('which apt-get')
        })

        it('runs an array-form custom command via execFile so each element is a true argv token', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })
            const server = new WaylandDisplayServer()

            await server.install({ command: ['apt', 'install', 'weston'] })

            expect(mockExecAsync).toHaveBeenCalledWith('apt', ['install', 'weston'], { timeout: 240000 })
        })

        it('returns false when custom command fails', async () => {
            mockExecAsync.mockRejectedValueOnce(new Error('install failed'))
            const server = new WaylandDisplayServer()

            const result = await server.install({ command: 'bad-cmd' })

            expect(result).toBe(false)
        })

        it('installs via apt when detected and running as root', async () => {
            queuePackageManagerDetection('apt')
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })
            ;(process as any).getuid = vi.fn().mockReturnValue(0)
            const server = new WaylandDisplayServer()

            const result = await server.install({ mode: 'root' })

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith(
                'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y weston',
                { timeout: 240000 }
            )
        })

        it.each([
            ['dnf', 'dnf -y makecache && dnf -y install weston'],
            ['yum', 'yum -y makecache && yum -y install weston'],
            ['zypper', 'zypper --non-interactive refresh && zypper --non-interactive install -y weston'],
            ['pacman', 'pacman -Sy --noconfirm weston'],
            ['apk', 'apk update && apk add --no-cache weston'],
            ['xbps', 'xbps-install -Sy weston'],
        ])('uses the correct install command for %s', async (pm, expectedCmd) => {
            queuePackageManagerDetection(pm)
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })
            ;(process as any).getuid = vi.fn().mockReturnValue(0)
            const server = new WaylandDisplayServer()

            const result = await server.install({ mode: 'root' })

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd, { timeout: 240000 })
        })

        it('returns false when the install command itself fails', async () => {
            queuePackageManagerDetection('apt')
            mockExecAsync.mockRejectedValueOnce(new Error('apt failed'))
            ;(process as any).getuid = vi.fn().mockReturnValue(0)
            const server = new WaylandDisplayServer()

            const result = await server.install({ mode: 'root' })

            expect(result).toBe(false)
        })
    })

    describe('startDaemon', () => {
        it('spawns weston, awaits its socket, and returns a daemon handle with env vars', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new WaylandDisplayServer()
            const daemon = await server.startDaemon({ width: 1280, height: 720 })

            expect(mockMkdir).toHaveBeenCalledWith(
                expect.stringMatching(/^\/tmp\/wdio-wayland-\d+-\d+$/),
                { recursive: true, mode: 0o700 }
            )
            expect(mockSpawn).toHaveBeenCalledWith(
                'weston',
                expect.arrayContaining([
                    '--backend=headless',
                    '--width=1280',
                    '--height=720',
                    '--use-pixman',
                    expect.stringMatching(/^--socket=wayland-\d+$/),
                ]),
                expect.objectContaining({
                    stdio: ['ignore', 'ignore', 'pipe'],
                    env: expect.objectContaining({
                        XDG_RUNTIME_DIR: expect.stringMatching(/^\/tmp\/wdio-wayland-/),
                    }),
                })
            )

            expect(daemon.env.WAYLAND_DISPLAY).toMatch(/^wayland-\d+$/)
            expect(daemon.env.XDG_RUNTIME_DIR).toMatch(/^\/tmp\/wdio-wayland-/)
            expect(daemon.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')
        })

        it('uses default dimensions when options omitted', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new WaylandDisplayServer()
            await server.startDaemon()

            expect(mockSpawn).toHaveBeenCalledWith(
                'weston',
                expect.arrayContaining(['--width=1920', '--height=1080']),
                expect.anything()
            )
        })

        it('rejects when weston exits before the socket appears', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockRejectedValue(new Error('ENOENT'))

            const server = new WaylandDisplayServer()
            const startPromise = server.startDaemon()

            // Let the start path register listeners, then simulate an early exit.
            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 1, null)

            await expect(startPromise).rejects.toThrow(/Weston process exited unexpectedly/)
        })

        it('rejects when the weston process errors before the socket appears', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockRejectedValue(new Error('ENOENT'))

            const server = new WaylandDisplayServer()
            const startPromise = server.startDaemon()

            await new Promise((r) => setImmediate(r))
            proc.emit('error', new Error('spawn failed'))

            await expect(startPromise).rejects.toThrow(/Weston process error: spawn failed/)
        })

        describe('daemon.stop()', () => {
            it('sends SIGTERM, removes the runtime dir, and is idempotent', async () => {
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new WaylandDisplayServer()
                const daemon = await server.startDaemon()

                const stopPromise = daemon.stop()
                // Let the stop() handler attach its 'exit' listener before we emit.
                await new Promise((r) => setImmediate(r))
                proc.emit('exit', 0, null)
                await stopPromise

                expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
                expect(mockRm).toHaveBeenCalledWith(
                    expect.stringMatching(/^\/tmp\/wdio-wayland-/),
                    { recursive: true, force: true }
                )

                // Second stop() is a no-op
                mockRm.mockClear()
                proc.kill.mockClear()
                await daemon.stop()
                expect(proc.kill).not.toHaveBeenCalled()
                expect(mockRm).not.toHaveBeenCalled()
            })

            it('escalates to SIGKILL if SIGTERM does not terminate within 1s', async () => {
                vi.useFakeTimers()
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new WaylandDisplayServer()
                const daemon = await server.startDaemon()

                // SIGTERM stays "alive" — never emit 'exit'. We need exitCode=null
                // so the SIGKILL escalation path runs.
                proc.kill = vi.fn(() => false) as any
                ;(proc as any).exitCode = null

                const stopPromise = daemon.stop()
                await vi.advanceTimersByTimeAsync(1000)
                await stopPromise

                expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
                expect(proc.kill).toHaveBeenCalledWith('SIGKILL')
                vi.useRealTimers()
            })
        })

        describe('daemon.stopSync()', () => {
            it('SIGKILLs the Weston child and rmSyncs the runtime dir', async () => {
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new WaylandDisplayServer()
                const daemon = await server.startDaemon()
                const runtimeDir = daemon.env.XDG_RUNTIME_DIR

                daemon.stopSync()

                // 'exit' listeners can't await — sync SIGKILL is the only thing
                // that guarantees the Weston child is gone, and rmSync is the
                // only fs call that completes before Node tears down.
                expect(proc.kill).toHaveBeenCalledWith('SIGKILL')
                expect(mockRmSync).toHaveBeenCalledWith(runtimeDir, { recursive: true, force: true })
            })

            it('is idempotent across stop() and itself', async () => {
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new WaylandDisplayServer()
                const daemon = await server.startDaemon()

                daemon.stopSync()
                daemon.stopSync()
                await daemon.stop()

                // First stopSync did the kill + rmSync; subsequent calls are no-ops.
                expect(proc.kill).toHaveBeenCalledTimes(1)
                expect(mockRmSync).toHaveBeenCalledTimes(1)
                // stop() short-circuits when stopped is already true → no async rm.
                expect(mockRm).not.toHaveBeenCalled()
            })
        })
    })

    describe('waitForSocket (via startDaemon)', () => {
        it('polls until the socket appears', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess
                .mockRejectedValueOnce(new Error('ENOENT'))
                .mockRejectedValueOnce(new Error('ENOENT'))
                .mockResolvedValueOnce(undefined)

            const server = new WaylandDisplayServer()
            const daemon = await server.startDaemon()

            expect(daemon.env.WAYLAND_DISPLAY).toBeTruthy()
            expect(mockAccess).toHaveBeenCalled()
        })
    })
})
