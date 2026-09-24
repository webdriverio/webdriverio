import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import { arrangeDisplayFdSpawn, arrangeSpawn, exitOnKill } from './helpers.js'

const mockSpawn = vi.hoisted(() => vi.fn())
const mockWaitForSocket = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    spawn: mockSpawn,
}))

// runDaemon only consumes waitForSocket from utils; mocking it lets us drive the
// socket-vs-exit race deterministically without touching the fs.
vi.mock('../src/utils.js', () => ({
    waitForSocket: mockWaitForSocket,
}))

const { runDaemon } = await import('../src/daemonProcess.js')

// runDaemon takes `log` as a param, so no @wdio/logger mock is needed.
const makeLog = () =>
    ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }) as never

const startDaemon = (overrides: Partial<Parameters<typeof runDaemon>[0]> = {}) =>
    runDaemon({
        command: 'test-daemon',
        args: ['--headless'],
        ready: { socketPath: '/tmp/test-daemon.sock', socketLabel: 'test socket', env: { TEST_VAR: 'value' } },
        label: 'TestDaemon',
        log: makeLog(),
        ...overrides,
    })

const displayFdReady = () => ({ displayFd: true as const, env: (display: string) => ({ DISPLAY: `:${display}` }) })

const NEVER = () => new Promise<void>(() => {})

describe('runDaemon', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockWaitForSocket.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('startup', () => {
        it('spawns the command with the pipe-stderr stdio option and returns a handle exposing the passed env', async () => {
            arrangeSpawn(mockSpawn)
            const env = { DISPLAY: ':1' }

            const daemon = await startDaemon({
                command: 'Xvfb',
                args: [':1'],
                ready: { socketPath: '/tmp/test-daemon.sock', socketLabel: 'test socket', env },
            })

            expect(mockSpawn).toHaveBeenCalledWith('Xvfb', [':1'], {
                stdio: ['ignore', 'ignore', 'pipe'],
            })
            expect(daemon.env).toBe(env)
        })

        it('passes spawnEnv to spawn when provided', async () => {
            arrangeSpawn(mockSpawn)
            const spawnEnv = { XDG_RUNTIME_DIR: '/tmp/rt' }

            await startDaemon({ spawnEnv })

            expect(mockSpawn).toHaveBeenCalledWith('test-daemon', ['--headless'], {
                stdio: ['ignore', 'ignore', 'pipe'],
                env: spawnEnv,
            })
        })

        it('rejects with the exit code and signal when the process exits before the socket appears', async () => {
            const proc = arrangeSpawn(mockSpawn, undefined, { exited: true })
            mockWaitForSocket.mockReturnValue(NEVER())

            const startPromise = startDaemon()
            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 1, null)

            await expect(startPromise).rejects.toThrow(
                /TestDaemon process exited unexpectedly \(code=1, signal=null\)/
            )
        })

        it('includes the stderr tail in the exit rejection', async () => {
            const proc = arrangeSpawn(mockSpawn, undefined, { exited: true })
            mockWaitForSocket.mockReturnValue(NEVER())

            const startPromise = startDaemon()
            await new Promise((r) => setImmediate(r))
            proc.stderr.emit('data', 'boom on stderr')
            proc.emit('exit', 2, 'SIGABRT')

            const err = await startPromise.catch((e: Error) => e)
            expect((err as Error).message).toContain('code=2, signal=SIGABRT')
            expect((err as Error).message).toContain('boom on stderr')
        })

        it('includes the stderr tail when the socket never appears', async () => {
            const proc = arrangeSpawn(mockSpawn)
            exitOnKill(proc)
            mockWaitForSocket.mockRejectedValue(new Error('Timed out waiting for test socket'))

            const startPromise = startDaemon()
            proc.stderr.emit('data', 'failed to load the shell')

            await expect(startPromise).rejects.toThrow('Timed out waiting for test socket\nfailed to load the shell')
        })

        it('rejects with the error message when the process errors before the socket appears', async () => {
            const proc = arrangeSpawn(mockSpawn, undefined, { exited: true })
            mockWaitForSocket.mockReturnValue(NEVER())

            const startPromise = startDaemon()
            await new Promise((r) => setImmediate(r))
            proc.emit('error', new Error('spawn ENOENT'))

            await expect(startPromise).rejects.toThrow(/TestDaemon process error: spawn ENOENT/)
        })

        it('runs cleanup and SIGTERMs a still-running process when startup fails', async () => {
            const cleanup = vi.fn()
            const proc = arrangeSpawn(mockSpawn)
            exitOnKill(proc)
            mockWaitForSocket.mockReturnValue(NEVER())

            const startPromise = startDaemon({ cleanup })
            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 1, null)

            await expect(startPromise).rejects.toThrow()
            expect(cleanup).toHaveBeenCalledTimes(1)
            expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
        })
    })

    describe('displayFd readiness', () => {
        it('opens fd 3 as a pipe, reads the display number from it, and derives env from it', async () => {
            arrangeDisplayFdSpawn(mockSpawn, 42)
            const env = vi.fn((display: string) => ({ DISPLAY: `:${display}` }))

            const daemon = await startDaemon({ ready: { displayFd: true, env } })

            expect(mockSpawn).toHaveBeenCalledWith('test-daemon', ['--headless'], {
                stdio: ['ignore', 'ignore', 'pipe', 'pipe'],
            })
            expect(env).toHaveBeenCalledWith('42')
            expect(daemon.env).toEqual({ DISPLAY: ':42' })
            expect(mockWaitForSocket).not.toHaveBeenCalled()
        })

        it('rejects when the process exits before reporting a display', async () => {
            const proc = arrangeDisplayFdSpawn(mockSpawn, null, { exited: true })

            const startPromise = startDaemon({ ready: displayFdReady() })
            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 1, null)

            await expect(startPromise).rejects.toThrow(/TestDaemon process exited unexpectedly/)
        })

        it('SIGTERMs the child and rejects with the stderr tail when no display arrives within the timeout', async () => {
            const proc = arrangeDisplayFdSpawn(mockSpawn, null)
            exitOnKill(proc)

            const startPromise = startDaemon({ ready: displayFdReady(), timeoutMs: 20 })
            await new Promise((r) => setImmediate(r))
            proc.stderr.emit('data', 'mkdir(/tmp/.X11-unix) failed')

            const err = await startPromise.catch((e: Error) => e)
            expect((err as Error).message).toContain('Timed out waiting for TestDaemon to report its display on fd 3')
            expect((err as Error).message).toContain('mkdir(/tmp/.X11-unix) failed')
            expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
        })
    })

    describe('stop()', () => {
        it('sends SIGTERM then escalates to SIGKILL when the process does not exit within 1s', async () => {
            vi.useFakeTimers()
            const proc = arrangeSpawn(mockSpawn)

            const daemon = await startDaemon()

            const stopPromise = daemon.stop()
            await vi.advanceTimersByTimeAsync(1000)

            expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
            expect(proc.kill).toHaveBeenCalledWith('SIGKILL')

            // SIGKILL fired; the process now dies. terminate() waits for 'exit'
            // after SIGKILL (2s wedge fallback), so stop() only resolves once it fires.
            proc.emit('exit', null, 'SIGKILL')
            await stopPromise
        })

        it('runs cleanup after the process has exited', async () => {
            const cleanup = vi.fn()
            const proc = arrangeSpawn(mockSpawn)

            const daemon = await startDaemon({ cleanup })

            const stopPromise = daemon.stop()
            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 0, null)
            await stopPromise

            expect(proc.kill).toHaveBeenCalledWith('SIGTERM')
            expect(cleanup).toHaveBeenCalledTimes(1)
        })

        it('is memoized and idempotent — a second call is a no-op returning the same promise', async () => {
            const proc = arrangeSpawn(mockSpawn)

            const daemon = await startDaemon()

            const p1 = daemon.stop()
            const p2 = daemon.stop()
            expect(p2).toBe(p1)

            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 0, null)
            await p1

            expect(proc.kill).toHaveBeenCalledTimes(1)
            expect(proc.kill).toHaveBeenCalledWith('SIGTERM')

            proc.kill.mockClear()
            await daemon.stop()
            expect(proc.kill).not.toHaveBeenCalled()
        })
    })

    describe('stopSync()', () => {
        it('SIGKILLs synchronously and runs cleanupSync', async () => {
            const cleanupSync = vi.fn()
            const proc = arrangeSpawn(mockSpawn)

            const daemon = await startDaemon({ cleanupSync })

            daemon.stopSync()

            expect(proc.kill).toHaveBeenCalledWith('SIGKILL')
            expect(cleanupSync).toHaveBeenCalledTimes(1)
        })

        it('is idempotent across itself and after stop()', async () => {
            const cleanup = vi.fn()
            const cleanupSync = vi.fn()
            const proc = arrangeSpawn(mockSpawn)

            const daemon = await startDaemon({ cleanup, cleanupSync })

            daemon.stopSync()
            daemon.stopSync()
            await daemon.stop()

            // Only the first stopSync() acts; the second and the subsequent stop()
            // short-circuit, so the async cleanup never runs.
            expect(proc.kill).toHaveBeenCalledTimes(1)
            expect(proc.kill).toHaveBeenCalledWith('SIGKILL')
            expect(cleanupSync).toHaveBeenCalledTimes(1)
            expect(cleanup).not.toHaveBeenCalled()
        })
    })
})
