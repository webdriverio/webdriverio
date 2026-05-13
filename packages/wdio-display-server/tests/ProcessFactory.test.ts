import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { ChildProcess } from 'node:child_process'

// Use vi.hoisted to ensure mocks are set up before imports
const mockSpawn = vi.hoisted(() => vi.fn())
const mockFork = vi.hoisted(() => vi.fn())
const mockExecSync = vi.hoisted(() => vi.fn())

// Mock child_process module
vi.mock('node:child_process', () => ({
    spawn: mockSpawn,
    fork: mockFork,
    execSync: mockExecSync
}))

// Mock logger
vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }))
}))

// Mock DisplayServerManager (legacy name: XvfbManager — preserved for clarity in this file).
// The ProcessFactory now consults `getDisplayServer()` to decide whether to wrap, instead of
// probing `which xvfb-run` itself.
const mockXvfbManager = {
    shouldRun: vi.fn(),
    init: vi.fn(),
    executeWithRetry: vi.fn(),
    getDisplayServer: vi.fn(() => null),
}

const makeFakeDisplayServer = () => ({
    name: 'xvfb' as const,
    isAvailable: vi.fn(),
    install: vi.fn(),
    getEnvironment: vi.fn(() => ({ DISPLAY: ':99' })),
    getProcessWrapper: vi.fn(() => ['xvfb-run', '--auto-servernum', '--']),
    getChromeFlags: vi.fn(() => []),
    startDaemon: vi.fn(),
})

vi.mock('../src/DisplayServerManager.js', () => ({
    DisplayServerManager: vi.fn(() => mockXvfbManager)
}))

// Import after mocks are set up. The class is now DisplayProcessFactory.
const { DisplayProcessFactory: ProcessFactory } = await import('../src/DisplayProcessFactory.js')

describe('ProcessFactory', () => {
    let processFactory: InstanceType<typeof ProcessFactory>
    const mockChildProcess = {
        on: vi.fn(),
        send: vi.fn(),
        kill: vi.fn(),
        pid: 12345,
        stdout: null,
        stderr: null,
        stdin: null
    } as unknown as ChildProcess

    beforeEach(() => {
        vi.clearAllMocks()
        processFactory = new ProcessFactory()

        // Reset mock implementations
        mockSpawn.mockReturnValue(mockChildProcess)
        mockFork.mockReturnValue(mockChildProcess)
        mockExecSync.mockReturnValue('success')
        mockXvfbManager.shouldRun.mockReturnValue(false)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        it('should create instance with default XvfbManager', () => {
            const factory = new ProcessFactory()
            expect(factory).toBeInstanceOf(ProcessFactory)
        })

        it('should create instance with custom XvfbManager', () => {
            const customManager = mockXvfbManager
            const factory = new ProcessFactory(customManager as any)
            expect(factory).toBeInstanceOf(ProcessFactory)
        })
    })

    describe('createWorkerProcess', () => {
        const scriptPath = '/path/to/script.js'
        const args = ['--arg1', '--arg2']
        const options = {
            cwd: '/working/dir',
            env: { NODE_ENV: 'test' },
            execArgv: ['--inspect'],
            stdio: ['inherit', 'pipe', 'pipe', 'ipc'] as ('inherit' | 'pipe' | 'ignore' | 'ipc')[]
        }

        describe('when xvfb should not run', () => {
            beforeEach(() => {
                mockXvfbManager.shouldRun.mockReturnValue(false)
            })

            it('should use regular fork when xvfb is not needed', async () => {
                const result = await processFactory.createWorkerProcess(scriptPath, args, options)

                expect(mockXvfbManager.shouldRun).toHaveBeenCalled()
                expect(mockFork).toHaveBeenCalledWith(scriptPath, args, {
                    cwd: options.cwd,
                    env: options.env,
                    execArgv: options.execArgv,
                    stdio: options.stdio
                })
                expect(mockSpawn).not.toHaveBeenCalled()
                expect(result).toBe(mockChildProcess)
            })

            it('should not wrap with xvfb-run when explicitly disabled', async () => {
                mockXvfbManager.shouldRun.mockReturnValue(false) // disabled -> shouldRun false
                // even if xvfb-run exists, we shouldn't check for it when shouldRun is false
                mockExecSync.mockReturnValue('/usr/bin/xvfb-run')

                await processFactory.createWorkerProcess(scriptPath, args, options)

                // we still call execSync('which xvfb-run') before deciding, so we only assert we didn't spawn xvfb-run
                expect(mockSpawn).not.toHaveBeenCalled()
                expect(mockFork).toHaveBeenCalled()
            })

            it('should use fork with default execArgv when not provided', async () => {
                const { execArgv: _ignored, ...optionsWithoutExecArgv } = options

                await processFactory.createWorkerProcess(scriptPath, args, optionsWithoutExecArgv)

                expect(mockFork).toHaveBeenCalledWith(scriptPath, args, {
                    cwd: options.cwd,
                    env: options.env,
                    execArgv: [],
                    stdio: options.stdio
                })
            })
        })

        describe('when display server should run', () => {
            beforeEach(() => {
                mockXvfbManager.shouldRun.mockReturnValue(true)
                mockXvfbManager.executeWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => await fn())
            })

            it('uses executeWithRetry and the display server wrapper when available', async () => {
                const fakeServer = makeFakeDisplayServer()
                mockXvfbManager.getDisplayServer.mockReturnValue(fakeServer as never)

                const mockProcess = {
                    ...mockChildProcess,
                    on: vi.fn(),
                    once: vi.fn(),
                } as unknown as ChildProcess
                mockSpawn.mockReturnValue(mockProcess)

                const result = await processFactory.createWorkerProcess(scriptPath, args, options)

                expect(mockXvfbManager.shouldRun).toHaveBeenCalled()
                expect(mockXvfbManager.getDisplayServer).toHaveBeenCalled()
                expect(mockXvfbManager.executeWithRetry).toHaveBeenCalledWith(
                    expect.any(Function),
                    'xvfb worker process creation'
                )
                expect(fakeServer.getProcessWrapper).toHaveBeenCalled()
                expect(mockSpawn).toHaveBeenCalled()
                expect(mockFork).not.toHaveBeenCalled()
                expect(result).toBe(mockProcess)
            })

            it('falls back to fork when no display server is available', async () => {
                mockXvfbManager.getDisplayServer.mockReturnValue(null)

                const result = await processFactory.createWorkerProcess(scriptPath, args, options)

                expect(mockXvfbManager.shouldRun).toHaveBeenCalled()
                expect(mockXvfbManager.getDisplayServer).toHaveBeenCalled()
                expect(mockXvfbManager.executeWithRetry).not.toHaveBeenCalled()
                expect(mockFork).toHaveBeenCalledWith(scriptPath, args, {
                    cwd: options.cwd,
                    env: options.env,
                    execArgv: options.execArgv,
                    stdio: options.stdio
                })
                expect(mockSpawn).not.toHaveBeenCalled()
                expect(result).toBe(mockChildProcess)
            })
        })

        describe('edge cases', () => {
            it('should handle minimal options', async () => {
                mockXvfbManager.shouldRun.mockReturnValue(false)
                const minimalOptions = {}

                await processFactory.createWorkerProcess(scriptPath, args, minimalOptions)

                expect(mockFork).toHaveBeenCalledWith(scriptPath, args, {
                    cwd: undefined,
                    env: undefined,
                    execArgv: [],
                    stdio: undefined
                })
            })

            it('should handle empty args array', async () => {
                mockXvfbManager.shouldRun.mockReturnValue(false)

                await processFactory.createWorkerProcess(scriptPath, [], options)

                expect(mockFork).toHaveBeenCalledWith(scriptPath, [], {
                    cwd: options.cwd,
                    env: options.env,
                    execArgv: options.execArgv,
                    stdio: options.stdio
                })
            })
        })
    })

    describe('Wayland path (startDaemon + fork)', () => {
        const scriptPath = '/path/to/script.js'
        const args = ['--arg1']
        const options = {
            cwd: '/working/dir',
            env: { NODE_ENV: 'test' },
            execArgv: ['--inspect'],
            stdio: ['inherit', 'pipe', 'pipe', 'ipc'] as ('inherit' | 'pipe' | 'ignore' | 'ipc')[]
        }

        const makeWaylandServer = () => ({
            name: 'wayland' as const,
            isAvailable: vi.fn(),
            install: vi.fn(),
            getEnvironment: vi.fn(() => ({})),
            // Wayland intentionally exposes no process wrapper (would break IPC)
            getProcessWrapper: vi.fn(() => null),
            getChromeFlags: vi.fn(() => []),
            startDaemon: vi.fn(),
        })

        beforeEach(() => {
            mockXvfbManager.shouldRun.mockReturnValue(true)
            mockXvfbManager.executeWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => await fn())
        })

        it('starts a per-worker Weston daemon and forks the worker with merged env', async () => {
            const waylandServer = makeWaylandServer()
            const daemonStop = vi.fn().mockResolvedValue(undefined)
            waylandServer.startDaemon.mockResolvedValue({
                env: {
                    WAYLAND_DISPLAY: 'wayland-1',
                    XDG_RUNTIME_DIR: '/tmp/wdio-wayland-x',
                    ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
                },
                stop: daemonStop,
            })
            mockXvfbManager.getDisplayServer.mockReturnValue(waylandServer as never)

            const mockProcess = {
                ...mockChildProcess,
                on: vi.fn(),
                once: vi.fn(),
            } as unknown as ChildProcess
            mockFork.mockReturnValue(mockProcess)

            const result = await processFactory.createWorkerProcess(scriptPath, args, options)

            expect(waylandServer.startDaemon).toHaveBeenCalled()
            // Falls through to fork() (not spawn) so the IPC fd is preserved
            expect(mockSpawn).not.toHaveBeenCalled()
            expect(mockFork).toHaveBeenCalledWith(scriptPath, args, {
                cwd: options.cwd,
                env: {
                    NODE_ENV: 'test',
                    WAYLAND_DISPLAY: 'wayland-1',
                    XDG_RUNTIME_DIR: '/tmp/wdio-wayland-x',
                    ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
                },
                execArgv: options.execArgv,
                stdio: options.stdio,
            })
            expect(result).toBe(mockProcess)
            // The factory should register an exit hook to stop the daemon
            expect((mockProcess.once as any)).toHaveBeenCalledWith('exit', expect.any(Function))
        })

        it('stops the daemon when the forked worker exits', async () => {
            const waylandServer = makeWaylandServer()
            const daemonStop = vi.fn().mockResolvedValue(undefined)
            waylandServer.startDaemon.mockResolvedValue({
                env: { WAYLAND_DISPLAY: 'wayland-1' },
                stop: daemonStop,
            })
            mockXvfbManager.getDisplayServer.mockReturnValue(waylandServer as never)

            // Capture the 'exit' listener so we can invoke it manually.
            let exitListener: (() => void) | undefined
            const mockProcess = {
                ...mockChildProcess,
                on: vi.fn(),
                once: vi.fn((event: string, listener: () => void) => {
                    if (event === 'exit') {
                        exitListener = listener
                    }
                }),
            } as unknown as ChildProcess
            mockFork.mockReturnValue(mockProcess)

            await processFactory.createWorkerProcess(scriptPath, args, options)

            expect(exitListener).toBeDefined()
            exitListener!()
            // Allow microtasks to drain (stop() is fire-and-forget)
            await new Promise((r) => setImmediate(r))

            expect(daemonStop).toHaveBeenCalledTimes(1)
        })

        it('stops the daemon and rethrows when fork() throws synchronously', async () => {
            const waylandServer = makeWaylandServer()
            const daemonStop = vi.fn().mockResolvedValue(undefined)
            waylandServer.startDaemon.mockResolvedValue({
                env: { WAYLAND_DISPLAY: 'wayland-1' },
                stop: daemonStop,
            })
            mockXvfbManager.getDisplayServer.mockReturnValue(waylandServer as never)

            mockFork.mockImplementation(() => {
                throw new Error('fork blew up')
            })

            await expect(
                processFactory.createWorkerProcess(scriptPath, args, options)
            ).rejects.toThrow('fork blew up')

            expect(daemonStop).toHaveBeenCalledTimes(1)
        })

        it('does not invoke the Xvfb spawn-wrapper path for Wayland', async () => {
            const waylandServer = makeWaylandServer()
            const daemonStop = vi.fn().mockResolvedValue(undefined)
            waylandServer.startDaemon.mockResolvedValue({
                env: { WAYLAND_DISPLAY: 'wayland-1' },
                stop: daemonStop,
            })
            mockXvfbManager.getDisplayServer.mockReturnValue(waylandServer as never)

            const mockProcess = {
                ...mockChildProcess,
                on: vi.fn(),
                once: vi.fn(),
            } as unknown as ChildProcess
            mockFork.mockReturnValue(mockProcess)

            await processFactory.createWorkerProcess(scriptPath, args, options)

            // getProcessWrapper() must not be consulted on the Wayland path
            expect(waylandServer.getProcessWrapper).not.toHaveBeenCalled()
        })
    })

    describe('Xvfb spawn-wrapper construction', () => {
        const scriptPath = '/path/to/script.js'
        const args = ['--arg1']
        const options = {
            cwd: '/working/dir',
            env: { NODE_ENV: 'test' },
            execArgv: ['--inspect'],
            stdio: ['inherit', 'pipe', 'pipe', 'ipc'] as ('inherit' | 'pipe' | 'ignore' | 'ipc')[]
        }

        beforeEach(() => {
            mockXvfbManager.shouldRun.mockReturnValue(true)
            mockXvfbManager.executeWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => await fn())
        })

        it('spawns xvfb-run with process.execPath (not hardcoded "node")', async () => {
            const fakeServer = makeFakeDisplayServer()
            mockXvfbManager.getDisplayServer.mockReturnValue(fakeServer as never)

            const mockProcess = {
                ...mockChildProcess,
                on: vi.fn(),
                once: vi.fn(),
            } as unknown as ChildProcess
            mockSpawn.mockReturnValue(mockProcess)

            await processFactory.createWorkerProcess(scriptPath, args, options)

            expect(mockSpawn).toHaveBeenCalledWith(
                'xvfb-run',
                expect.arrayContaining([
                    '--auto-servernum',
                    '--',
                    process.execPath,
                    '--inspect',
                    scriptPath,
                    '--arg1',
                ]),
                expect.objectContaining({
                    cwd: options.cwd,
                    stdio: options.stdio,
                })
            )
        })

        it('falls through to regular fork when the server exposes no wrapper', async () => {
            const fakeServer = makeFakeDisplayServer()
            fakeServer.getProcessWrapper = vi.fn(() => null)
            mockXvfbManager.getDisplayServer.mockReturnValue(fakeServer as never)

            await processFactory.createWorkerProcess(scriptPath, args, options)

            expect(mockSpawn).not.toHaveBeenCalled()
            expect(mockFork).toHaveBeenCalled()
        })

        it('rejects when the spawned wrapper exits with a non-zero code before the 2s grace window', async () => {
            const fakeServer = makeFakeDisplayServer()
            mockXvfbManager.getDisplayServer.mockReturnValue(fakeServer as never)

            // Capture the 'exit' handler so we can fire it manually.
            let exitHandler: ((code: number, signal: NodeJS.Signals | null) => void) | undefined
            const mockProcess = {
                ...mockChildProcess,
                on: vi.fn((event: string, handler: any) => {
                    if (event === 'exit') {
                        exitHandler = handler
                    }
                }),
                once: vi.fn(),
            } as unknown as ChildProcess
            mockSpawn.mockReturnValue(mockProcess)

            const resultPromise = processFactory.createWorkerProcess(scriptPath, args, options)
            await new Promise((r) => setImmediate(r))

            expect(exitHandler).toBeDefined()
            exitHandler!(1, null)

            await expect(resultPromise).rejects.toThrow(/xvfb process exited with code 1/)
        })

        it('resolves with the spawned process after the 2s grace window', async () => {
            vi.useFakeTimers()
            try {
                const fakeServer = makeFakeDisplayServer()
                mockXvfbManager.getDisplayServer.mockReturnValue(fakeServer as never)

                const mockProcess = {
                    ...mockChildProcess,
                    on: vi.fn(),
                    once: vi.fn(),
                } as unknown as ChildProcess
                mockSpawn.mockReturnValue(mockProcess)

                const resultPromise = processFactory.createWorkerProcess(scriptPath, args, options)

                // Before the 2s timer fires, the promise hasn't settled.
                await vi.advanceTimersByTimeAsync(1999)
                await vi.advanceTimersByTimeAsync(1)
                await expect(resultPromise).resolves.toBe(mockProcess)
            } finally {
                vi.useRealTimers()
            }
        })
    })

    describe('integration with DisplayServerManager', () => {
        it('calls shouldRun on the manager', async () => {
            const customManager = {
                shouldRun: vi.fn().mockReturnValue(false),
                executeWithRetry: vi.fn(),
                getDisplayServer: vi.fn(() => null),
            }
            const factory = new ProcessFactory(customManager as never)

            await factory.createWorkerProcess('/script.js', [], {})

            expect(customManager.shouldRun).toHaveBeenCalled()
        })

        it('respects the manager decision and uses the wrapper when a display server is selected', async () => {
            const fakeServer = makeFakeDisplayServer()
            const customManager = {
                shouldRun: vi.fn().mockReturnValue(true),
                executeWithRetry: vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => await fn()),
                getDisplayServer: vi.fn(() => fakeServer),
            }
            const factory = new ProcessFactory(customManager as never)

            const mockProcess = {
                ...mockChildProcess,
                on: vi.fn(),
                once: vi.fn(),
            } as unknown as ChildProcess
            mockSpawn.mockReturnValue(mockProcess)

            await factory.createWorkerProcess('/script.js', [], {})

            expect(customManager.shouldRun).toHaveBeenCalled()
            expect(customManager.executeWithRetry).toHaveBeenCalled()
            expect(fakeServer.getProcessWrapper).toHaveBeenCalled()
            expect(mockFork).not.toHaveBeenCalled()
        })
    })

})
