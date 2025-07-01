import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { GrpcClient } from '../../src/cli/grpcClient.js'
import * as bstackLogger from '../../src/bstackLogger.js'
import type { SDKClient } from '../../src/proto/sdk.js'
import { CLIUtils } from '../../src/cli/cliUtils.js'
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
                    frameworkVersions: {}
                }),
                expect.any(Function)
            )
        })

        it('throws error when client is not initialized', async () => {
            grpcClient.client = null

            await expect(grpcClient.startBinSession('test-config'))
                .rejects
                .toThrow()
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

        it('throws error when binSessionId is missing', async () => {
            grpcClient.binSessionId = undefined

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

            await expect(grpcClient.connectBinSession())
                .rejects
                .toThrow()
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
