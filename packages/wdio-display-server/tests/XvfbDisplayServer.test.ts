import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockSpawn = vi.hoisted(() => vi.fn())
const mockAccess = vi.hoisted(() => vi.fn())
const mockReaddir = vi.hoisted(() => vi.fn())
const mockDetectPackageManager = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    spawn: mockSpawn,
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync),
}))

vi.mock('node:fs/promises', () => ({
    access: mockAccess,
    readdir: mockReaddir,
}))

vi.mock('../src/utils.js', () => ({
    detectPackageManager: mockDetectPackageManager,
}))

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
            expect(mockExecAsync).not.toHaveBeenCalled()
            expect(mockDetectPackageManager).not.toHaveBeenCalled()
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
            mockDetectPackageManager.mockResolvedValueOnce(pm)
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })
            ;(process as any).getuid = vi.fn().mockReturnValue(0)
            const server = new XvfbDisplayServer()

            const result = await server.install({ mode: 'root' })

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd, { timeout: 240000 })
        })

        it('returns false when the package manager is unknown', async () => {
            mockDetectPackageManager.mockResolvedValueOnce('unknown')
            const server = new XvfbDisplayServer()

            const result = await server.install({ mode: 'root' })

            expect(result).toBe(false)
        })
    })

    describe('getEnvironment / getProcessWrapper / getChromeFlags', () => {
        it('getEnvironment returns {} (xvfb-run sets DISPLAY post-exec)', () => {
            expect(new XvfbDisplayServer().getEnvironment()).toEqual({})
        })

        it('getProcessWrapper returns xvfb-run with --auto-servernum --', () => {
            expect(new XvfbDisplayServer().getProcessWrapper()).toEqual([
                'xvfb-run',
                '--auto-servernum',
                '--',
            ])
        })

        it('getChromeFlags returns [] (Xvfb needs no special Chrome flags)', () => {
            expect(new XvfbDisplayServer().getChromeFlags()).toEqual([])
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

        it('daemon.stop() sends SIGTERM, releases the reservation, and is idempotent', async () => {
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

        it('daemon.stop() escalates to SIGKILL when SIGTERM does not terminate within 1s', async () => {
            vi.useFakeTimers()
            const proc = new FakeProc()
            mockSpawn.mockReturnValue(proc)
            mockAccess.mockResolvedValue(undefined)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            proc.kill = vi.fn(() => false) as any
            ;(proc as any).killed = false

            const stopPromise = daemon.stop()
            await vi.advanceTimersByTimeAsync(1000)
            await stopPromise

            expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
            expect(proc.kill).toHaveBeenCalledWith('SIGKILL')
            vi.useRealTimers()
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
