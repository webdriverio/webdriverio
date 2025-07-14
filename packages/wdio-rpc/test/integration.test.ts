import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClientRpc, createServerRpc } from '../src/index.js'
import { IPC_MESSAGE_TYPES, WS_MESSAGE_TYPES } from '@wdio/types'
import type { ServerFunctions, ClientFunctions } from '../src/types.js'

describe('RPC Integration Tests', () => {
    let mockSend: ReturnType<typeof vi.fn>
    let mockOn: ReturnType<typeof vi.fn>
    let mockOff: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockSend = vi.fn()
        mockOn = vi.fn()
        mockOff = vi.fn()

        vi.stubGlobal('process', {
            send: mockSend,
            on: mockOn,
            off: mockOff
        } as unknown as NodeJS.Process)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    describe('Session Lifecycle Integration', () => {
        it('should handle complete session lifecycle through RPC', async () => {
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn(),
                sessionEnded: vi.fn(),
                sessionMetadata: vi.fn(),
                testFrameworkInitMessage: vi.fn(),
                errorMessage: vi.fn(),
                snapshotResults: vi.fn(),
                printFailureMessage: vi.fn(),
                workerEvent: vi.fn(),
                workerResponse: vi.fn()
            }

            const clientHandlers: Partial<ClientFunctions> = {
                consoleMessage: vi.fn(),
                commandResponseMessage: vi.fn(),
                hookResultMessage: vi.fn(),
                expectResponseMessage: vi.fn(),
                coverageMap: vi.fn(),
                runCommand: vi.fn(),
                triggerHook: vi.fn(),
                expectRequest: vi.fn(),
                expectMatchersRequest: vi.fn(),
                browserTestResult: vi.fn()
            }

            // Create RPC instances
            const serverRpc = createServerRpc(serverHandlers)
            const clientRpc = createClientRpc(clientHandlers)

            // Simulate session start
            const sessionStartData = {
                origin: 'worker' as const,
                name: 'sessionStarted' as const,
                content: {
                    sessionId: 'test-session-123',
                    isW3C: true,
                    protocol: 'https',
                    hostname: 'localhost',
                    port: 4444,
                    path: '/wd/hub',
                    headers: {},
                    isMultiremote: false,
                    injectGlobals: true,
                    capabilities: { browserName: 'chrome' }
                },
                cid: '0-0'
            }

            // Simulate session metadata
            const sessionMetadata = {
                automationProtocol: 'webdriver',
                sessionId: 'test-session-123',
                isW3C: true,
                protocol: 'https',
                hostname: 'localhost',
                port: 4444,
                path: '/wd/hub',
                queryParams: {},
                isMultiremote: false,
                capabilities: { browserName: 'chrome' },
                injectGlobals: true,
                headers: {}
            }

            // Simulate framework init
            const frameworkInit = {
                cid: '0-0',
                caps: { browserName: 'chrome' },
                specs: ['test.spec.js'],
                hasTests: true
            }

            // Test session start flow
            await serverRpc.sessionStarted(sessionStartData)
            await serverRpc.sessionMetadata(sessionMetadata)
            await serverRpc.testFrameworkInitMessage(frameworkInit)

            expect(serverHandlers.sessionStarted).toHaveBeenCalledWith(sessionStartData)
            expect(serverHandlers.sessionMetadata).toHaveBeenCalledWith(sessionMetadata)
            expect(serverHandlers.testFrameworkInitMessage).toHaveBeenCalledWith(frameworkInit)

            // Test session end flow
            const sessionEndData = {
                origin: 'worker' as const,
                name: 'sessionEnded' as const,
                content: {},
                cid: '0-0'
            }

            await serverRpc.sessionEnded(sessionEndData)
            expect(serverHandlers.sessionEnded).toHaveBeenCalledWith(sessionEndData)
        })
    })

    describe('Error Handling Integration', () => {
        it('should handle RPC errors gracefully', () => {
            const onError = vi.fn()

            // Test with process.send not available
            vi.stubGlobal('process', {
                send: undefined,
                on: mockOn
            } as unknown as NodeJS.Process)

            expect(() => {
                createClientRpc({}, { onError })
            }).toThrow('process.send not available - RPC communication disabled')

            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'process.send not available - RPC communication disabled'
                })
            )
        })

        it('should handle message sending errors', () => {
            const onError = vi.fn()
            mockSend.mockImplementation(() => {
                throw new Error('Network error')
            })

            const clientRpc = createClientRpc({}, { onError })

            expect(() => {
                // This would normally be called by birpc internally
                // We're testing the error handling in our post function
                const postFn = (clientRpc as any).post || mockSend
                postFn('test message')
            }).toThrow('Failed to send RPC message')

            expect(onError).toHaveBeenCalled()
        })
    })

    describe('High Volume Message Handling', () => {
        it('should handle high message volume without performance issues', async () => {
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn(),
                sessionEnded: vi.fn()
            }

            const serverRpc = createServerRpc(serverHandlers)

            const startTime = Date.now()
            const messageCount = 1000

            // Send many messages rapidly
            const promises = Array.from({ length: messageCount }, (_, i) =>
                serverRpc.sessionStarted({
                    origin: 'worker',
                    name: 'sessionStarted',
                    content: {
                        sessionId: `session-${i}`,
                        isW3C: true,
                        protocol: 'https',
                        hostname: 'localhost',
                        port: 4444,
                        path: '/wd/hub',
                        headers: {},
                        isMultiremote: false,
                        injectGlobals: true,
                        capabilities: { browserName: 'chrome' }
                    },
                    cid: `0-${i}`
                })
            )

            await Promise.all(promises)
            const endTime = Date.now()

            expect(serverHandlers.sessionStarted).toHaveBeenCalledTimes(messageCount)
            expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
        })
    })

    describe('Bi-directional Communication', () => {
        it('should support bi-directional RPC communication', async () => {
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn(),
                sessionEnded: vi.fn()
            }

            const clientHandlers: Partial<ClientFunctions> = {
                consoleMessage: vi.fn(),
                runCommand: vi.fn().mockResolvedValue('command result')
            }

            const serverRpc = createServerRpc(serverHandlers)
            const clientRpc = createClientRpc(clientHandlers)

            // Test server calling client
            const consoleData = {
                type: WS_MESSAGE_TYPES.consoleMessage,
                value: {
                    name: 'console.log',
                    args: ['test message'],
                    cid: '0-0'
                }
            }

            await clientRpc.consoleMessage(consoleData.value)
            expect(clientHandlers.consoleMessage).toHaveBeenCalledWith(consoleData.value)

            // Test client calling server
            const sessionData = {
                origin: 'worker' as const,
                name: 'sessionStarted' as const,
                content: {
                    sessionId: 'test-session',
                    isW3C: true,
                    protocol: 'https',
                    hostname: 'localhost',
                    port: 4444,
                    path: '/wd/hub',
                    headers: {},
                    isMultiremote: false,
                    injectGlobals: true,
                    capabilities: { browserName: 'chrome' }
                },
                cid: '0-0'
            }

            await serverRpc.sessionStarted(sessionData)
            expect(serverHandlers.sessionStarted).toHaveBeenCalledWith(sessionData)
        })
    })
})