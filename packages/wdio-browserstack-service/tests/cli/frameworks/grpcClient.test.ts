import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { GrpcClient } from '../../../src/cli/grpcClient.js'
import * as bstackLogger from '../../../src/bstackLogger.js'
import type { SDKClient } from '@browserstack/wdio-browserstack-service'
import { CLIUtils } from '../../../src/cli/cliUtils.js'
import type grpc from '@grpc/grpc-js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('GrpcClient', () => {
    let grpcClient: GrpcClient
    beforeEach(() => {
        vi.resetAllMocks()
        grpcClient = GrpcClient.getInstance()
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.restoreAllMocks()
    })

    describe('Singleton Pattern', () => {
        it('should return the same instance when called multiple times', () => {
            const instance1 = GrpcClient.getInstance()
            const instance2 = GrpcClient.getInstance()
            expect(instance1).toBe(instance2)
        })
    })

    describe('getClient()', () => {
        it('should return null when client is not initialized', () => {
            expect(grpcClient.getClient()).toBe(null)
        })

        it('should return SDKClient instance when client is initialized', () => {
            const mockClient = {} as SDKClient
            grpcClient.client = mockClient

            expect(grpcClient.getClient()).toEqual(mockClient)
        })
    })

    describe('getChannel()', () => {
        it('should return null when channel is not initialized', () => {
            expect(grpcClient.getChannel()).toBe(null)
        })

        it('should return grpc.Channel instance when channel is initialized', () => {
            const mockChannel = {} as grpc.Channel
            grpcClient.channel = mockChannel

            expect(grpcClient.getChannel()).toEqual(mockChannel)
        })
    })

    describe('startBinSession', () => {
        beforeEach(() => {
            vi.resetAllMocks()

            vi.spyOn(CLIUtils, 'getSdkVersion').mockReturnValue('1.0.0')
            vi.spyOn(CLIUtils, 'getAutomationFrameworkDetail').mockReturnValue({
                name: 'webdriver',
                version: {}
            })
            vi.spyOn(CLIUtils, 'getTestFrameworkDetail').mockReturnValue({
                name: '',
                version: {}
            })
            vi.spyOn(CLIUtils, 'getSdkLanguage').mockReturnValue('typescript')

            grpcClient = new GrpcClient()
            grpcClient.binSessionId = 'test-session-id'
        })

        it('successfully starts bin session', async () => {
            const mockResponse = { status: 'success' }
            const mockStartBinSession = vi.fn().mockImplementation((req, cb) => cb(null, mockResponse))
            grpcClient.client = { startBinSession: mockStartBinSession } as any

            const response = await grpcClient.startBinSession('test-config')

            expect(response).toEqual(mockResponse)
            expect(mockStartBinSession).toHaveBeenCalledWith(
                expect.objectContaining({
                    binSessionId: 'test-session-id',
                    sdkVersion: '1.0.0',
                    testFramework: '',
                    wdioConfig: 'test-config',
                    sdkLanguage: 'typescript',
                    language: 'typescript',
                    frameworks: ['webdriver', ''],
                    frameworkVersions: {},
                    // Additional fields that the implementation actually sends
                    pathProject: expect.any(String),
                    pathConfig: expect.any(String),
                    cliArgs: expect.any(Array)
                }),
                expect.any(Function)
            )
        })

        it('throws error when client is not initialized', async () => {
            grpcClient.client = null

            // The implementation logs but doesn't throw, then crashes when accessing this.client!
            // This results in a TypeError when trying to access properties on null
            await expect(grpcClient.startBinSession('test-config'))
                .rejects
                .toThrow(TypeError)
        })

        it('handles gRPC call errors', async () => {
            const mockError = new Error('Start session failed')
            const mockStartBinSession = vi.fn().mockImplementation((req, cb) => cb(mockError))
            grpcClient.client = { startBinSession: mockStartBinSession } as any

            await expect(grpcClient.startBinSession('test-config'))
                .rejects
                .toThrow('Start session failed')
        })
    })

    describe('stopBinSession', () => {
        beforeEach(() => {
            vi.resetAllMocks()

            grpcClient = new GrpcClient()
            grpcClient.binSessionId = 'test-session-id'
        })
        it('successfully stops bin session', async () => {
            const mockResponse = { status: 'success' }
            const mockStopBinSession = vi.fn().mockImplementation((req, cb) => cb(null, mockResponse))
            grpcClient.client = { stopBinSession: mockStopBinSession } as any

            const response = await grpcClient.stopBinSession()

            expect(response).toEqual(mockResponse)
        })

        it('successfully stops bin session', async () => {
            const mockResponse = { status: 'success' }
            const mockStopBinSession = vi.fn().mockImplementation((req, cb) => cb(null, mockResponse))
            grpcClient.client = { stopBinSession: mockStopBinSession } as any

            const response = await grpcClient.stopBinSession()

            expect(response).toEqual(mockResponse)
            expect(mockStopBinSession).toHaveBeenCalledWith(
                expect.objectContaining({
                    binSessionId: 'test-session-id'
                }),
                expect.any(Function)
            )
        })

        it('returns undefined when binSessionId is missing', async () => {
            grpcClient.binSessionId = undefined

            // The implementation catches the error and doesn't re-throw, returning undefined
            await expect(grpcClient.stopBinSession()).resolves.toBeUndefined()
        })

        it('returns undefined when client is not initialized', async () => {
            grpcClient.client = null

            // The implementation logs but doesn't throw, then catches any errors and returns undefined
            await expect(grpcClient.stopBinSession()).resolves.toBeUndefined()
        })

        it('returns undefined when gRPC call fails', async () => {
            const mockError = new Error('Stop session failed')
            const mockStopBinSession = vi.fn().mockImplementation((req, cb) => cb(mockError))
            grpcClient.client = { stopBinSession: mockStopBinSession } as any

            // The implementation catches gRPC errors and returns undefined instead of throwing
            await expect(grpcClient.stopBinSession()).resolves.toBeUndefined()
        })
    })

    describe('connectBinSession', () => {
        beforeEach(() => {
            vi.resetAllMocks()

            grpcClient = new GrpcClient()
            grpcClient.binSessionId = 'test-session-id'
        })

        it('successfully connects to bin session', async () => {
            const mockResponse = { status: 'connected' }
            const mockConnectBinSession = vi.fn().mockImplementation((req, cb) => cb(null, mockResponse))
            grpcClient.client = { connectBinSession: mockConnectBinSession } as any

            const response = await grpcClient.connectBinSession()

            expect(response).toEqual(mockResponse)
        })

        it('throws error when client is not initialized', async () => {
            grpcClient.client = null

            // The implementation logs but doesn't throw, then crashes when accessing this.client!
            await expect(grpcClient.connectBinSession())
                .rejects
                .toThrow(TypeError)
        })

        it('handles gRPC call errors', async () => {
            const mockError = new Error('Connection failed')
            const mockConnectBinSession = vi.fn().mockImplementation((req, cb) => cb(mockError))
            grpcClient.client = { connectBinSession: mockConnectBinSession } as any

            await expect(grpcClient.connectBinSession())
                .rejects
                .toThrow('Connection failed')
        })
    })

})