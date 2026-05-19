import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockSpawn = vi.hoisted(() => vi.fn())
const mockAccess = vi.hoisted(() => vi.fn())
const mockReaddir = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    execFile: vi.fn(),
    spawn: mockSpawn,
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync),
}))

vi.mock('node:fs/promises', () => ({
    access: mockAccess,
    readdir: mockReaddir,
}))

// Sequence execAsync responses so the real detectPackageManager (called by
// the shared installViaPackageManager helper) "finds" the requested PM.
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

const { XvfbDisplayServer } = await import('../src/XvfbDisplayServer.js')

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

const clearReservedDisplays = () => {
    // Reach into the static set used by findFreeDisplay() and reset it between
    // tests so we don't leak reservations across cases.
    (XvfbDisplayServer as any).reservedDisplays.clear()
}

describe('XvfbDisplayServer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clearReservedDisplays()
        mockReaddir.mockResolvedValue([])
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('isAvailable', () => {
        it('returns false when /etc/os-release identifies CentOS Stream 10', async () => {
            mockExecAsync.mockResolvedValueOnce({
                stdout: 'NAME="CentOS Stream"\nVERSION_ID="10"\n',
                stderr: '',
            })

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(false)
            // Must not even probe for xvfb-run after CentOS 10 detection
            expect(mockExecAsync).toHaveBeenCalledTimes(1)
        })

        it('returns true when both xvfb-run and Xvfb are on PATH', async () => {
            mockExecAsync
                .mockRejectedValueOnce(new Error('not centos')) // cat /etc/os-release
                .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                .mockResolvedValueOnce({ stdout: '/usr/bin/Xvfb', stderr: '' })

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(true)
        })

        it('returns false when xvfb-run is on PATH but Xvfb is missing', async () => {
            mockExecAsync
                .mockRejectedValueOnce(new Error('not centos'))
                .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                .mockRejectedValueOnce(new Error('no Xvfb'))

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(false)
        })

        it('returns false when /etc/os-release shows a different CentOS Stream version', async () => {
            mockExecAsync
                .mockResolvedValueOnce({
                    stdout: 'NAME="CentOS Stream"\nVERSION_ID="9"\n',
                    stderr: '',
                })
                .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                .mockResolvedValueOnce({ stdout: '/usr/bin/Xvfb', stderr: '' })

            const server = new XvfbDisplayServer()
            // Not CentOS 10 → continues with the normal probe → available
            expect(await server.isAvailable()).toBe(true)
        })
    })

    describe('install', () => {
        it('returns false immediately when CentOS 10 was detected by a prior isAvailable()', async () => {
            // Trigger CentOS 10 detection
            mockExecAsync.mockResolvedValueOnce({
                stdout: 'NAME="CentOS Stream"\nVERSION_ID="10"\n',
                stderr: '',
            })
            const server = new XvfbDisplayServer()
            await server.isAvailable()

            mockExecAsync.mockClear()
            const result = await server.install()

            expect(result).toBe(false)
            // Bail must happen before package-manager probing.
            expect(mockExecAsync).not.toHaveBeenCalled()
        })

        it.each([
            ['apt', 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb'],
            ['dnf', 'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb xorg-x11-server-utils'],
            ['yum', 'yum -y makecache && yum -y install xorg-x11-server-Xvfb xorg-x11-server-utils'],
            ['zypper', 'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run'],
            ['pacman', 'pacman -Sy --noconfirm xorg-server-xvfb'],
            ['apk', 'apk update && apk add --no-cache xvfb-run'],
            ['xbps', 'xbps-install -Sy xvfb'],
        ])('uses the correct install command for %s', async (pm, expectedCmd) => {
            queuePackageManagerDetection(pm)
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })
            ;(process as any).getuid = vi.fn().mockReturnValue(0)
            const server = new XvfbDisplayServer()

            const result = await server.install({ mode: 'root' })

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd, { timeout: 240000 })
        })
    })

    describe('getEnvironment', () => {
        it('returns {} (xvfb-run sets DISPLAY post-exec)', () => {
            expect(new XvfbDisplayServer().getEnvironment()).toEqual({})
        })
    })

    describe('getProcessWrapper', () => {
        it('returns xvfb-run with --auto-servernum --', () => {
            expect(new XvfbDisplayServer().getProcessWrapper()).toEqual([
                'xvfb-run',
                '--auto-servernum',
                '--',
            ])
        })
    })

    describe('getChromeFlags', () => {
        it('returns --ozone-platform=x11 (authoritative against a Wayland-host bleed-through)', () => {
            expect(new XvfbDisplayServer().getChromeFlags()).toEqual(['--ozone-platform=x11'])
        })
    })

    describe('startDaemon', () => {
        it('spawns Xvfb with the right args, waits for the socket, and returns DISPLAY', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon({ width: 800, height: 600, depth: 16 })

            expect(mockSpawn).toHaveBeenCalledWith(
                'Xvfb',
                expect.arrayContaining([
                    ':99',
                    '-screen',
                    '0',
                    '800x600x16',
                    '-nolisten',
                    'tcp',
                ]),
                { stdio: 'ignore' }
            )
            expect(daemon.env.DISPLAY).toBe(':99')
        })

        it('publishes GDK_BACKEND=x11 and ELECTRON_OZONE_PLATFORM_HINT=x11 in daemon env (Wayland-host fallback)', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            // These force GTK/Electron to the X11 backend even when the host
            // shell has GDK_BACKEND=wayland,x11 inherited from a Wayland desktop
            // session — otherwise the toolkit tries Wayland first and fails
            // because no compositor is listening (we're running Xvfb).
            expect(daemon.env.GDK_BACKEND).toBe('x11')
            expect(daemon.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('x11')
        })

        it('uses default 1920x1080x24 when options omitted', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            await server.startDaemon()

            expect(mockSpawn).toHaveBeenCalledWith(
                'Xvfb',
                expect.arrayContaining(['1920x1080x24']),
                { stdio: 'ignore' }
            )
        })

        it('releases the display reservation when Xvfb exits before the socket appears', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockRejectedValue(new Error('ENOENT'))

            const server = new XvfbDisplayServer()
            const startPromise = server.startDaemon()

            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 1, null)

            await expect(startPromise).rejects.toThrow(/Xvfb process exited unexpectedly/)
            // The reservation for :99 should have been released so a follow-up
            // start can claim the same number.
            expect((XvfbDisplayServer as any).reservedDisplays.has(99)).toBe(false)
        })

        describe('daemon.stop()', () => {
            it('sends SIGTERM, releases the reservation, and is idempotent', async () => {
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new XvfbDisplayServer()
                const daemon = await server.startDaemon()

                expect((XvfbDisplayServer as any).reservedDisplays.has(99)).toBe(true)

                const stopPromise = daemon.stop()
                await new Promise((r) => setImmediate(r))
                proc.emit('exit', 0, null)
                await stopPromise

                expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
                expect((XvfbDisplayServer as any).reservedDisplays.has(99)).toBe(false)

                proc.kill.mockClear()
                await daemon.stop()
                expect(proc.kill).not.toHaveBeenCalled()
            })

            it('escalates to SIGKILL when SIGTERM does not terminate within 1s', async () => {
                vi.useFakeTimers()
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new XvfbDisplayServer()
                const daemon = await server.startDaemon()

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
            it('SIGKILLs the Xvfb child synchronously', async () => {
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new XvfbDisplayServer()
                const daemon = await server.startDaemon()

                daemon.stopSync()

                // 'exit' listeners can't await — sync SIGKILL is the only thing
                // that guarantees the Xvfb child is gone before Node tears down.
                expect(proc.kill).toHaveBeenCalledWith('SIGKILL')
            })

            it('is idempotent across stop() and itself', async () => {
                const proc = new FakeProc()
                mockSpawn.mockReturnValue(proc)
                mockAccess.mockResolvedValue(undefined)

                const server = new XvfbDisplayServer()
                const daemon = await server.startDaemon()

                daemon.stopSync()
                daemon.stopSync()
                await daemon.stop()

                // Only the first stopSync() should have killed the process; the
                // second stopSync() and the subsequent stop() are no-ops.
                expect(proc.kill).toHaveBeenCalledTimes(1)
            })
        })
    })

    describe('findFreeDisplay (via startDaemon)', () => {
        it('skips display numbers whose sockets already exist on disk', async () => {
            mockReaddir.mockResolvedValue(['X99', 'X100', 'X150'])
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            // 99, 100, 150 are used → next free is 101
            expect(daemon.env.DISPLAY).toBe(':101')
        })

        it('does not pick a display already reserved in-memory', async () => {
            mockReaddir.mockResolvedValue([])
            // Pre-reserve :99 to simulate a concurrent caller having grabbed it.
            ;(XvfbDisplayServer as any).reservedDisplays.add(99)

            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            expect(daemon.env.DISPLAY).toBe(':100')
        })

        it('throws when the entire :99-:199 range is taken', async () => {
            // Pre-reserve everything in range.
            for (let n = 99; n < 200; n++) {
                ;(XvfbDisplayServer as any).reservedDisplays.add(n)
            }

            const server = new XvfbDisplayServer()
            await expect(server.startDaemon()).rejects.toThrow(/No free X display number/)
        })

        it('tolerates a missing /tmp/.X11-unix directory', async () => {
            mockReaddir.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            // Falls through to :99 when no sockets visible.
            expect(daemon.env.DISPLAY).toBe(':99')
        })

        it('skips display numbers with leftover .X<n>-lock files from a crashed Xvfb', async () => {
            // Reproduces the post-crash scenario: a previous Xvfb died after
            // creating /tmp/.X99-lock and /tmp/.X100-lock but cleanup removed
            // /tmp/.X11-unix/X99 and /tmp/.X11-unix/X100. Without scanning the
            // lock files we'd pick :99, Xvfb would refuse to start ("Server is
            // already active for display :99"), and every retry would re-pick
            // the same stale-locked number.
            mockReaddir.mockImplementation(async (dir: string) => {
                if (dir === '/tmp/.X11-unix') {
                    return [] // no live sockets
                }
                if (dir === '/tmp') {
                    return ['.X99-lock', '.X100-lock', 'unrelated.txt']
                }
                return []
            })
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            expect(daemon.env.DISPLAY).toBe(':101')
        })

        it('combines socket and lock-file evidence when finding a free display', async () => {
            mockReaddir.mockImplementation(async (dir: string) => {
                if (dir === '/tmp/.X11-unix') {
                    return ['X99'] // live display :99
                }
                if (dir === '/tmp') {
                    return ['.X100-lock'] // stale lock at :100
                }
                return []
            })
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            // :99 socket-used, :100 lock-stale → :101 is the first free.
            expect(daemon.env.DISPLAY).toBe(':101')
        })
    })

    describe('waitForSocket (via startDaemon)', () => {
        it('polls until the socket file exists', async () => {
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess
                .mockRejectedValueOnce(new Error('ENOENT'))
                .mockRejectedValueOnce(new Error('ENOENT'))
                .mockResolvedValueOnce(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            expect(daemon.env.DISPLAY).toBeTruthy()
            // At least three polls (two failures + success)
            expect(mockAccess.mock.calls.length).toBeGreaterThanOrEqual(3)
        })
    })
})
