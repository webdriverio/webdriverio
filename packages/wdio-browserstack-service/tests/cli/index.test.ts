import type { Mock } from 'vitest'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { spawn } from 'node:child_process'

import { GrpcClient } from '../../src/cli/grpcClient.js'
import { BrowserstackCLI } from '../../src/cli/index.js'

import * as bstackLogger from '../../src/bstackLogger.js'
import { CLIUtils } from '../../src/cli/cliUtils.js'
import TestHubModule from '../../src/cli/modules/TestHubModule.js'

const mockGetInstance = GrpcClient.getInstance as Mock

vi.mock('../../src/cli/grpcClient.js', () => ({
    GrpcClient: {
        getInstance: vi.fn()
    }
}))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('BrowserstackCLI', () => {
    let browserstackCLI: BrowserstackCLI
    let mockGrpcClient: any
    let startMainSpy: any
    let startChildSpy: any

    beforeEach(() => {
        vi.resetAllMocks()
        browserstackCLI = BrowserstackCLI.getInstance()
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
        })
    })

    describe('startMain', () => {
        beforeEach(() => {
            vi.resetAllMocks()

            mockGrpcClient = {
                init: vi.fn(),
                connect: vi.fn().mockResolvedValue(undefined),
                connectBinSession: vi.fn().mockResolvedValue({}),
                startBinSession: vi.fn().mockResolvedValue({
                    binSessionId: 'test-session-id',
                    config: JSON.stringify({ test: 'config' })
                }),
                stopBinSession: vi.fn().mockResolvedValue({})
            }

            mockGetInstance.mockReturnValue(mockGrpcClient)

            browserstackCLI = new BrowserstackCLI()
        })

        it('starts the main process and initializes a bin session', async () => {
            const startSpy = vi.spyOn(browserstackCLI, 'start').mockResolvedValue()
            browserstackCLI.wdioConfig = 'test-config'

            await browserstackCLI.startMain()

            expect(startSpy).toHaveBeenCalled()
            expect(mockGrpcClient.startBinSession).toHaveBeenCalledWith('test-config')
            expect(browserstackCLI.isMainConnected).toBe(true)
        })

        it('handles errors during start', async () => {
            const startError = new Error('Start failed')
            vi.spyOn(browserstackCLI, 'start').mockRejectedValue(startError)

            await expect(browserstackCLI.startMain()).rejects.toThrow('Start failed')
        })
    })

    describe('startChild', () => {
        beforeEach(() => {
            vi.resetAllMocks()

            mockGrpcClient = {
                init: vi.fn(),
                connect: vi.fn().mockResolvedValue(undefined),
                connectBinSession: vi.fn().mockResolvedValue({
                    binSessionId: 'test-session-id',
                    config: JSON.stringify({ test: 'config' })
                }),
                startBinSession: vi.fn().mockResolvedValue({
                    binSessionId: 'test-session-id',
                    config: JSON.stringify({ test: 'config' })
                }),
                stopBinSession: vi.fn().mockResolvedValue({})
            }

            mockGetInstance.mockReturnValue(mockGrpcClient)
            browserstackCLI = new BrowserstackCLI()
            vi.spyOn(browserstackCLI, 'start').mockResolvedValue()
        })

        it('connects to an existing bin session', async () => {
            const sessionId = 'test-session-id'

            await browserstackCLI.startChild(sessionId)

            expect(browserstackCLI.isChildConnected).toBe(true)
        })

        it('handles errors when connecting to bin session', async () => {
            const error = new Error('Connection error')
            mockGrpcClient.connectBinSession.mockRejectedValue(error)

            await browserstackCLI.startChild('test-session-id')

            expect(browserstackCLI.isChildConnected).toBe(false)
        })
    })

    describe('start', () => {
        let mockProcess: any

        beforeEach(() => {
            vi.resetAllMocks()

            mockProcess = {
                pid: 123,
                connected: false,
                stdout: { on: vi.fn() },
                stderr: { on: vi.fn() },
                on: vi.fn()
            }

            vi.mock('node:child_process', () => ({
                spawn: vi.fn(() => mockProcess)
            }))

            // Mock CLIUtils
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            vi.spyOn(CLIUtils, 'getCLIParamsForDevEnv').mockReturnValue({ test: 'params' })

            browserstackCLI = new BrowserstackCLI()
        })

        it('resolves immediately in development environment', async () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(true)
            vi.spyOn(browserstackCLI, 'loadCliParams').mockImplementation(() => {})

            await browserstackCLI.start()

            expect(CLIUtils.getCLIParamsForDevEnv).toHaveBeenCalled()
            expect(browserstackCLI.loadCliParams).toHaveBeenCalledWith({ test: 'params' })
        })

        it('skips process creation if already connected', async () => {
            browserstackCLI.process = { connected: true } as any

            await browserstackCLI.start()

            expect(spawn).not.toHaveBeenCalled()
        })
    })

    describe('stop', () => {
        let mockProcess: any

        beforeEach(() => {
            vi.resetAllMocks()

            mockProcess = {
                pid: 123,
                kill: vi.fn(),
                on: vi.fn()
            }

            mockGrpcClient = {
                stopBinSession: vi.fn().mockResolvedValue({ status: 'success' })
            }
            mockGetInstance.mockReturnValue(mockGrpcClient)

            browserstackCLI = new BrowserstackCLI()
            browserstackCLI.process = mockProcess

            vi.spyOn(browserstackCLI, 'unConfigureModules').mockResolvedValue()
        })

        it('stops bin session and kills process for main connection', async () => {
            browserstackCLI.isMainConnected = true
            mockProcess.on.mockImplementation((event: string, callback: () => void) => {
                if (event === 'exit') {
                    setTimeout(callback, 10)
                }
            })

            await browserstackCLI.stop()

            expect(mockGrpcClient.stopBinSession).toHaveBeenCalled()
            expect(browserstackCLI.unConfigureModules).toHaveBeenCalled()
            expect(mockProcess.kill).toHaveBeenCalled()
        })

        it('handles errors during stop session', async () => {
            browserstackCLI.isMainConnected = true
            const error = new Error('Stop session failed')
            mockGrpcClient.stopBinSession.mockRejectedValue(error)

            await expect(browserstackCLI.stop()).resolves.not.toThrow()
        })

        it('handles case when process is not available', async () => {
            browserstackCLI.process = null

            await browserstackCLI.stop()

            expect(browserstackCLI.unConfigureModules).toHaveBeenCalled()
        })
    })

    describe('loadModules', () => {
        let browserstackCLI: BrowserstackCLI
        let mockStartBinResponse: any

        beforeEach(() => {
            vi.resetAllMocks()

            browserstackCLI = new BrowserstackCLI()
            vi.spyOn(browserstackCLI, 'configureModules').mockResolvedValue()

            mockStartBinResponse = {
                binSessionId: 'test-session-id',
                config: JSON.stringify({ test: 'config' }),
                testhub: {}
            }
        })

        it('loads and configures modules based on bin session response', () => {
            browserstackCLI.loadModules(mockStartBinResponse)

            expect(browserstackCLI.binSessionId).toBe('test-session-id')
            expect(browserstackCLI.modules[TestHubModule.MODULE_NAME]).toBeInstanceOf(TestHubModule)
            expect(browserstackCLI.configureModules).toHaveBeenCalled()
        })

        it('handles response without testhub data', () => {
            const responseWithoutTestHub = {
                binSessionId: 'test-session-id',
                config: JSON.stringify({ test: 'config' })
            }

            browserstackCLI.loadModules(responseWithoutTestHub)

            expect(browserstackCLI.modules[TestHubModule.MODULE_NAME]).toBeUndefined()
            expect(browserstackCLI.configureModules).toHaveBeenCalled()
        })

        it('sets config from response', () => {
            browserstackCLI.loadModules(mockStartBinResponse)

            expect(browserstackCLI.getConfig()).toEqual({ test: 'config' })
        })
    })

    describe('isRunning', () => {
        beforeEach(() => {
            vi.resetAllMocks()

            mockGrpcClient = {
                getClient: vi.fn().mockReturnValue({}),
                getChannel: vi.fn().mockReturnValue({
                    getConnectivityState: vi.fn().mockReturnValue(1) // Not disconnected (4)
                })
            }
            mockGetInstance.mockReturnValue(mockGrpcClient)

            browserstackCLI = new BrowserstackCLI()
        })

        it('returns true in development environment', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(true)
            expect(browserstackCLI.isRunning()).toBe(true)
        })

        it('returns true for connected main process', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isMainConnected = true
            browserstackCLI.process = { exitCode: null } as any

            expect(browserstackCLI.isRunning()).toBe(true)
            expect(mockGrpcClient.getClient).toHaveBeenCalled()
            expect(mockGrpcClient.getChannel).toHaveBeenCalled()
        })

        it('returns true for connected child process', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isChildConnected = true

            expect(browserstackCLI.isRunning()).toBe(true)
            expect(mockGrpcClient.getChannel).toHaveBeenCalled()
        })

        it('returns false when main process is disconnected', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isMainConnected = true
            browserstackCLI.process = { exitCode: 0 } as any

            expect(browserstackCLI.isRunning()).toBe(false)
        })

        it('returns false when gRPC channel is disconnected', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isMainConnected = true
            browserstackCLI.process = { exitCode: null } as any
            mockGrpcClient.getChannel().getConnectivityState.mockReturnValue(4) // Disconnected

            expect(browserstackCLI.isRunning()).toBe(false)
        })

        it('returns false when no process is connected', () => {
            vi.spyOn(CLIUtils, 'isDevelopmentEnv').mockReturnValue(false)
            browserstackCLI.isMainConnected = false
            browserstackCLI.isChildConnected = false

            expect(browserstackCLI.isRunning()).toBe(false)
        })
    })

    describe('getCliBinPath', () => {
        beforeEach(() => {
            vi.resetAllMocks()
            vi.spyOn(CLIUtils, 'setupCliPath')
        })
        afterEach(() => {
            vi.resetAllMocks()
        })
        it('sets up path if not cached', async () => {
            vi.spyOn(CLIUtils, 'setupCliPath').mockResolvedValue('/new/path')
            browserstackCLI.browserstackConfig = { key: 'value' }

            const path = await browserstackCLI.getCliBinPath()

            expect(path).toBe('/new/path')
            expect(CLIUtils.setupCliPath).toHaveBeenCalledWith({ key: 'value' })
            expect(browserstackCLI.SDK_CLI_BIN_PATH).toBe('/new/path')
        })
        it('returns cached path if available', async () => {
            browserstackCLI.SDK_CLI_BIN_PATH = '/cached/path'

            const path = await browserstackCLI.getCliBinPath()

            expect(path).toBe('/cached/path')
            expect(CLIUtils.setupCliPath).not.toHaveBeenCalled()
        })
    })
})
