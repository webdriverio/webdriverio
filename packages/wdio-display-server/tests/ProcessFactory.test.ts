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
