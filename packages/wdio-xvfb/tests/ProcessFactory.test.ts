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
        warn: vi.fn()
    }))
}))

// Mock XvfbManager
const mockXvfbManager = {
    shouldRun: vi.fn(),
    init: vi.fn(),
    executeWithRetry: vi.fn()
}

vi.mock('../src/XvfbManager.js', () => ({
    XvfbManager: vi.fn(() => mockXvfbManager)
}))

// Import after mocks are set up
const { ProcessFactory } = await import('../src/ProcessFactory.js')

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

        describe('when xvfb should run', () => {
            beforeEach(() => {
                mockXvfbManager.shouldRun.mockReturnValue(true)
                mockXvfbManager.executeWithRetry.mockImplementation(async (fn) => await fn())
            })

            it('should use executeWithRetry when xvfb is available', async () => {
                mockExecSync.mockReturnValue('/usr/bin/xvfb-run')

                const mockProcess = {
                    ...mockChildProcess,
                    on: vi.fn()
                } as unknown as ChildProcess
                mockSpawn.mockReturnValue(mockProcess)

                const result = await processFactory.createWorkerProcess(scriptPath, args, options)

                expect(mockXvfbManager.shouldRun).toHaveBeenCalled()
                expect(mockExecSync).toHaveBeenCalledWith('which xvfb-run', { stdio: 'ignore' })
                expect(mockXvfbManager.executeWithRetry).toHaveBeenCalledWith(
                    expect.any(Function),
                    'xvfb worker process creation'
                )
                expect(mockFork).not.toHaveBeenCalled()
                expect(result).toBe(mockProcess)
            })

            it('should fallback to fork when xvfb-run is not available', async () => {
                mockExecSync.mockImplementation(() => {
                    throw new Error('Command not found')
                })

                const result = await processFactory.createWorkerProcess(scriptPath, args, options)

                expect(mockXvfbManager.shouldRun).toHaveBeenCalled()
                expect(mockExecSync).toHaveBeenCalledWith('which xvfb-run', { stdio: 'ignore' })
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

    describe('integration with XvfbManager', () => {
        it('should call shouldRun on the XvfbManager instance', async () => {
            const customManager = {
                shouldRun: vi.fn().mockReturnValue(false),
                executeWithRetry: vi.fn()
            }
            const factory = new ProcessFactory(customManager as any)

            await factory.createWorkerProcess('/script.js', [], {})

            expect(customManager.shouldRun).toHaveBeenCalled()
        })

        it('should respect XvfbManager decision about whether to run xvfb', async () => {
            const customManager = {
                shouldRun: vi.fn().mockReturnValue(true),
                executeWithRetry: vi.fn().mockImplementation(async (fn) => await fn())
            }
            const factory = new ProcessFactory(customManager as any)
            mockExecSync.mockReturnValue('/usr/bin/xvfb-run')

            const mockProcess = {
                ...mockChildProcess,
                on: vi.fn()
            } as unknown as ChildProcess
            mockSpawn.mockReturnValue(mockProcess)

            await factory.createWorkerProcess('/script.js', [], {})

            expect(customManager.shouldRun).toHaveBeenCalled()
            expect(customManager.executeWithRetry).toHaveBeenCalled()
            expect(mockFork).not.toHaveBeenCalled()
        })
    })

})
