import type { Mock } from 'vitest'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import EventEmitter from 'node:events'
import { spawn } from 'node:child_process'

import { BrowserstackCLI } from '../../src/cli/index.js'
import * as bstackLogger from '../../src/bstackLogger.js'
import PerformanceTester from '../../src/instrumentation/performance/performance-tester.js'
import { CLIUtils } from '../../src/cli/cliUtils.js'
import { GrpcClient } from '../../src/cli/grpcClient.js'

const mockGetInstance = GrpcClient.getInstance as Mock
vi.mock('node:child_process', () => ({
    spawn: vi.fn()
}))

vi.mock('../../src/cli/grpcClient.js', () => ({
    GrpcClient: {
        getInstance: vi.fn()
    }
}))

vi.mock('../../src/cli/cliUtils.js', () => ({
    CLIUtils: {
        isDevelopmentEnv: vi.fn(),
        getCLIParamsForDevEnv: vi.fn(),
        setupCliPath: vi.fn().mockResolvedValue('/path/to/cli')
    }
}))

vi.mock('../../src/instrumentation/performance/performance-tester.js', () => ({
    default: {
        start: vi.fn(),
        end: vi.fn()
    }
}))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('BrowserstackCLI', () => {
    let browserstackCLI: BrowserstackCLI
    let mockGrpcClient: any
    // const mockHandler = vi.fn()
    let startMainSpy: any
    let startChildSpy: any
    let mockProcess: any

    beforeEach(() => {
        vi.resetAllMocks()

        mockGrpcClient = {
            init: vi.fn(),
            startBinSession: vi.fn().mockResolvedValue({
                binSessionId: 'test-session-id',
                config: JSON.stringify({ test: 'config' }),
            }),
            stopBinSession: vi.fn().mockResolvedValue({}),
            connect: vi.fn(),
            connectBinSession: vi.fn().mockResolvedValue({}),
        }

        mockGetInstance.mockReturnValue(mockGrpcClient)
        // Setup mock child process
        mockProcess = new EventEmitter()
        mockProcess.stdout = new EventEmitter()
        mockProcess.stderr = new EventEmitter()
        mockProcess.pid = 12345
        mockProcess.kill = vi.fn()
        mockProcess.exitCode = null
        mockProcess.connected = true

        // spawn.mockReturnValue(mockProcess)
        browserstackCLI = BrowserstackCLI.getInstance()
    })
    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('bootstrap', () => {
        it('start main process if initiating first time', async () => {
            startMainSpy = vi.spyOn(browserstackCLI, 'startMain').mockImplementation(async () => {})
            startChildSpy = vi.spyOn(browserstackCLI, 'startChild').mockImplementation(async () => {})

            // Ensure the environment variable is cleared
            delete process.env.BROWSERSTACK_CLI_BIN_SESSION_ID

            const wdioConfig = 'DummyConfig'
            await browserstackCLI.bootstrap(wdioConfig)
            expect(startMainSpy).toHaveBeenCalledOnce()
            expect(startChildSpy).not.toHaveBeenCalled()
        })
        it('starts child process if BROWSERSTACK_CLI_BIN_SESSION_ID is set', async () => {
            const startMainSpy = vi.spyOn(browserstackCLI, 'startMain').mockImplementation(async () => {})
            const startChildSpy = vi.spyOn(browserstackCLI, 'startChild').mockImplementation(async () => {})

            // Set the environment variable
            process.env.BROWSERSTACK_CLI_BIN_SESSION_ID = 'test-session-id'

            await browserstackCLI.bootstrap()
            expect(startChildSpy).toHaveBeenCalledWith('test-session-id')
            expect(startMainSpy).not.toHaveBeenCalled()

            // Clean up
            delete process.env.BROWSERSTACK_CLI_BIN_SESSION_ID
        })
        it('handles errors during bootstrap and stops the CLI', async () => {
            const error = new Error('Bootstrap error')
            const stopSpy = vi.spyOn(browserstackCLI, 'stop').mockResolvedValue()
            vi.spyOn(browserstackCLI, 'startMain').mockRejectedValue(error)

            await browserstackCLI.bootstrap()

            expect(stopSpy).toHaveBeenCalled()
            expect(PerformanceTester.end).toHaveBeenCalledWith(expect.any(String), false, expect.stringContaining('Bootstrap error'))
        })
    })

    describe('startMain', () => {
        it('starts the main process and initializes a bin session', async () => {
            const startSpy = vi.spyOn(browserstackCLI, 'start').mockResolvedValue()
            browserstackCLI.wdioConfig = 'test-config'

            await browserstackCLI.startMain()

            expect(startSpy).toHaveBeenCalled()
            expect(mockGrpcClient.startBinSession).toHaveBeenCalledWith('test-config')
            expect(browserstackCLI.isMainConnected).toBe(true)
        })
    })

    describe('startChild', () => {
        it('connects to an existing bin session', async () => {
            await browserstackCLI.startChild('test-session-id')

            expect(mockGrpcClient.connect).toHaveBeenCalled()
            expect(mockGrpcClient.connectBinSession).toHaveBeenCalled()
            expect(browserstackCLI.isChildConnected).toBe(true)
        })

        it('handles errors when connecting to bin session', async () => {
            mockGrpcClient.connectBinSession.mockRejectedValue(new Error('Connection error'))

            await browserstackCLI.startChild('test-session-id')

            expect(browserstackCLI.isChildConnected).toBe(false)
            expect(PerformanceTester.end).toHaveBeenCalledWith(
                expect.any(String),
                false,
                expect.stringContaining('Connection error')
            )
        })
    })

    describe('start', () => {
        it('resolves immediately in development environment', async () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(true)
            vi.spyOn(CLIUtils, 'getCLIParamsForDevEnv').mockReturnValue({ id: 'dev-id', port: '8080' })

            await browserstackCLI.start()

            expect(browserstackCLI.cliParams).toEqual({ id: 'dev-id', port: '8080' })
            expect(mockGrpcClient.init).toHaveBeenCalledWith({ id: 'dev-id', port: '8080' })
            expect(spawn).not.toHaveBeenCalled()
        })

        it('resolves immediately if process is already running', async () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.process = mockProcess
            mockProcess.connected = true

            await browserstackCLI.start()

            expect(spawn).not.toHaveBeenCalled()
        })

        it('spawns CLI process and resolves when ready', async () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            vi.spyOn(CLIUtils, 'setupCliPath').mockResolvedValue('/path/to/cli')

            browserstackCLI.process = mockProcess

            const startPromise = browserstackCLI.start()

            // Simulate CLI output indicating it's ready
            setTimeout(() => {
                mockProcess.stdout.emit('data', Buffer.from('id=test-id\nport=9000\nready'))
            }, 10)

            await startPromise

            expect(spawn).toHaveBeenCalledWith('/path/to/cli', ['sdk'], expect.any(Object))
            expect(browserstackCLI.cliParams).toEqual({ id: 'test-id', port: '9000' })
            expect(mockGrpcClient.init).toHaveBeenCalledWith({ id: 'test-id', port: '9000' })
        })

        it('rejects if the CLI process fails to start', async () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            vi.spyOn(CLIUtils, 'setupCliPath').mockResolvedValue('/path/to/cli')

            // Remove PID to simulate failed process start
            mockProcess.pid = undefined

            await expect(browserstackCLI.start()).rejects.toThrow('failed to start CLI, no PID found')
        })

        it('rejects if the CLI process encounters an error', async () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            vi.spyOn(CLIUtils, 'setupCliPath').mockResolvedValue('/path/to/cli')

            const startPromise = browserstackCLI.start()

            // Simulate an error in the process
            setTimeout(() => {
                mockProcess.emit('error', new Error('Process error'))
            }, 10)

            await expect(startPromise).rejects.toThrow('Failed to start CLI process: Process error')
        })
    })

    describe('stop', () => {
        it('stops the bin session and kills the process', async () => {
            browserstackCLI.isMainConnected = true
            browserstackCLI.process = mockProcess

            const stopPromise = browserstackCLI.stop()

            // Simulate process exit
            setTimeout(() => {
                mockProcess.emit('exit')
            }, 10)

            await stopPromise

            expect(mockGrpcClient.stopBinSession).toHaveBeenCalled()
            expect(mockProcess.kill).toHaveBeenCalled()
        })

        it('handles process timeout during stop', async () => {
            vi.useFakeTimers()
            browserstackCLI.isMainConnected = true
            browserstackCLI.process = mockProcess

            const stopPromise = browserstackCLI.stop()

            // Fast-forward past the timeout
            vi.runAllTimers()

            await stopPromise

            expect(mockProcess.kill).toHaveBeenCalledTimes(2)
            expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL')

            vi.useRealTimers()
        })

        it('handles errors during stop session', async () => {
            browserstackCLI.isMainConnected = true
            mockGrpcClient.stopBinSession.mockRejectedValue(new Error('Stop error'))

            await browserstackCLI.stop()

            expect(PerformanceTester.end).toHaveBeenCalledWith(
                expect.any(String),
                false,
                expect.stringContaining('Stop error')
            )
        })
    })

    describe('loadModules', () => {
        it('loads and configures modules based on bin session response', () => {
            const startBinResponse = {
                binSessionId: 'test-session-id',
                config: JSON.stringify({ test: 'config' }),
            }

            browserstackCLI.loadModules(startBinResponse)

            expect(browserstackCLI.binSessionId).toBe('test-session-id')
            expect(browserstackCLI.config).toEqual({ test: 'config' })
        })

        it('handles JSON parse errors in config', () => {
            const startBinResponse = {
                binSessionId: 'test-session-id',
                config: JSON.stringify({ test: 'config' }),
            }

            browserstackCLI.loadModules(startBinResponse)

            expect(browserstackCLI.binSessionId).toBe('test-session-id')
            expect(browserstackCLI.config).toEqual({})
        })
    })

    describe('isRunning', () => {
        it('returns true in development environment', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(true)

            expect(browserstackCLI.isRunning()).toBe(true)
        })

        it('returns true for connected main process', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isMainConnected = true
            browserstackCLI.process = mockProcess
            mockProcess.exitCode = null

            expect(browserstackCLI.isRunning()).toBe(true)
        })

        it('returns true for connected child process', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isMainConnected = false
            browserstackCLI.isChildConnected = true

            expect(browserstackCLI.isRunning()).toBe(true)
        })

        it('returns false when not running', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isMainConnected = false
            browserstackCLI.isChildConnected = false

            expect(browserstackCLI.isRunning()).toBe(false)
        })
    })

    describe('getCliBinPath', () => {
        it('returns cached path if available', async () => {
            browserstackCLI.SDK_CLI_BIN_PATH = '/cached/path'

            const path = await browserstackCLI.getCliBinPath()

            expect(path).toBe('/cached/path')
            expect(CLIUtils.setupCliPath).not.toHaveBeenCalled()
        })

        it('sets up path if not cached', async () => {
            vi.spyOn(CLIUtils, 'setupCliPath').mockResolvedValue('/new/path')
            browserstackCLI.browserstackConfig = { key: 'value' }

            const path = await browserstackCLI.getCliBinPath()

            expect(path).toBe('/new/path')
            expect(CLIUtils.setupCliPath).toHaveBeenCalledWith({ key: 'value' })
            expect(browserstackCLI.SDK_CLI_BIN_PATH).toBe('/new/path')
        })
    })
})
