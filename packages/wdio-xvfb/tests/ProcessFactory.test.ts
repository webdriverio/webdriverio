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
    init: vi.fn()
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
            stdio: ['inherit', 'pipe', 'pipe', 'ipc'] as const
        }

        describe('when xvfb should not run', () => {
            beforeEach(() => {
                mockXvfbManager.shouldRun.mockReturnValue(false)
            })

            it('should use regular fork when xvfb is not needed', () => {
                const result = processFactory.createWorkerProcess(scriptPath, args, options)

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

            it('should use fork with default execArgv when not provided', () => {
                const optionsWithoutExecArgv = { ...options }
                delete optionsWithoutExecArgv.execArgv

                processFactory.createWorkerProcess(scriptPath, args, optionsWithoutExecArgv)

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
            })

            it('should use spawn with xvfb-run when available', () => {
                mockExecSync.mockReturnValue('/usr/bin/xvfb-run')

                const result = processFactory.createWorkerProcess(scriptPath, args, options)

                expect(mockXvfbManager.shouldRun).toHaveBeenCalled()
                expect(mockExecSync).toHaveBeenCalledWith('which xvfb-run', { stdio: 'ignore' })
                expect(mockSpawn).toHaveBeenCalledWith(
                    'xvfb-run',
                    ['--auto-servernum', '--', 'node', ...options.execArgv, scriptPath, ...args],
                    {
                        cwd: options.cwd,
                        env: options.env,
                        stdio: options.stdio
                    }
                )
                expect(mockFork).not.toHaveBeenCalled()
                expect(result).toBe(mockChildProcess)
            })

            it('should use spawn with default execArgv when not provided', () => {
                mockExecSync.mockReturnValue('/usr/bin/xvfb-run')
                const optionsWithoutExecArgv = { ...options }
                delete optionsWithoutExecArgv.execArgv

                processFactory.createWorkerProcess(scriptPath, args, optionsWithoutExecArgv)

                expect(mockSpawn).toHaveBeenCalledWith(
                    'xvfb-run',
                    ['--auto-servernum', '--', 'node', scriptPath, ...args],
                    {
                        cwd: options.cwd,
                        env: options.env,
                        stdio: options.stdio
                    }
                )
            })

            it('should fallback to fork when xvfb-run is not available', () => {
                mockExecSync.mockImplementation(() => {
                    throw new Error('Command not found')
                })

                const result = processFactory.createWorkerProcess(scriptPath, args, options)

                expect(mockXvfbManager.shouldRun).toHaveBeenCalled()
                expect(mockExecSync).toHaveBeenCalledWith('which xvfb-run', { stdio: 'ignore' })
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
            it('should handle minimal options', () => {
                mockXvfbManager.shouldRun.mockReturnValue(false)
                const minimalOptions = {}

                processFactory.createWorkerProcess(scriptPath, args, minimalOptions)

                expect(mockFork).toHaveBeenCalledWith(scriptPath, args, {
                    cwd: undefined,
                    env: undefined,
                    execArgv: [],
                    stdio: undefined
                })
            })

            it('should handle empty args array', () => {
                mockXvfbManager.shouldRun.mockReturnValue(false)

                processFactory.createWorkerProcess(scriptPath, [], options)

                expect(mockFork).toHaveBeenCalledWith(scriptPath, [], {
                    cwd: options.cwd,
                    env: options.env,
                    execArgv: options.execArgv,
                    stdio: options.stdio
                })
            })

            it('should pass through all spawn options correctly', () => {
                mockXvfbManager.shouldRun.mockReturnValue(true)
                mockExecSync.mockReturnValue('/usr/bin/xvfb-run')

                const complexOptions = {
                    cwd: '/custom/working/dir',
                    env: {
                        NODE_ENV: 'production',
                        DEBUG: 'true',
                        CUSTOM_VAR: 'value'
                    },
                    execArgv: ['--inspect=9229', '--max-old-space-size=4096'],
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc'] as const
                }

                processFactory.createWorkerProcess(scriptPath, args, complexOptions)

                expect(mockSpawn).toHaveBeenCalledWith(
                    'xvfb-run',
                    [
                        '--auto-servernum',
                        '--',
                        'node',
                        '--inspect=9229',
                        '--max-old-space-size=4096',
                        scriptPath,
                        '--arg1',
                        '--arg2'
                    ],
                    {
                        cwd: '/custom/working/dir',
                        env: complexOptions.env,
                        stdio: complexOptions.stdio
                    }
                )
            })
        })
    })

    describe('integration with XvfbManager', () => {
        it('should call shouldRun on the XvfbManager instance', () => {
            const customManager = {
                shouldRun: vi.fn().mockReturnValue(false),
                init: vi.fn()
            }
            const factory = new ProcessFactory(customManager as any)

            factory.createWorkerProcess('/script.js', [], {})

            expect(customManager.shouldRun).toHaveBeenCalled()
        })

        it('should respect XvfbManager decision about whether to run xvfb', () => {
            const customManager = {
                shouldRun: vi.fn().mockReturnValue(true),
                init: vi.fn()
            }
            const factory = new ProcessFactory(customManager as any)
            mockExecSync.mockReturnValue('/usr/bin/xvfb-run')

            factory.createWorkerProcess('/script.js', [], {})

            expect(customManager.shouldRun).toHaveBeenCalled()
            expect(mockSpawn).toHaveBeenCalled()
            expect(mockFork).not.toHaveBeenCalled()
        })
    })
})