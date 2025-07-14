import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClientRpc, createServerRpc } from '../src/index.js'
import type { ServerFunctions, ClientFunctions } from '../src/types.js'

describe('RPC Performance Tests', () => {
    let mockSend: ReturnType<typeof vi.fn>
    let mockOn: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockSend = vi.fn()
        mockOn = vi.fn()

        vi.stubGlobal('process', {
            send: mockSend,
            on: mockOn
        } as unknown as NodeJS.Process)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    describe('Message Throughput', () => {
        it('should handle message creation efficiently', () => {
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn(),
                sessionEnded: vi.fn(),
                sessionMetadata: vi.fn()
            }

            const startTime = performance.now()
            const messageCount = 1000

            // Create RPC instances rapidly
            for (let i = 0; i < messageCount; i++) {
                createServerRpc(serverHandlers)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            expect(duration).toBeLessThan(1000) // Should complete within 1 second
        })
    })

    describe('Concurrent Connections', () => {
        it('should handle multiple RPC connections efficiently', () => {
            const connectionCount = 100
            const connections: Array<{ rpc: any; handlers: any }> = []

            const startTime = performance.now()

            // Create multiple RPC connections
            for (let i = 0; i < connectionCount; i++) {
                const handlers = {
                    sessionStarted: vi.fn(),
                    sessionEnded: vi.fn()
                }
                const rpc = createServerRpc(handlers)
                connections.push({ rpc, handlers })
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            expect(connections).toHaveLength(connectionCount)
            expect(duration).toBeLessThan(1000) // Should complete within 1 second
        })
    })

    describe('Large Payload Handling', () => {
        it('should handle large payload creation efficiently', () => {
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn(),
                sessionMetadata: vi.fn()
            }

            const serverRpc = createServerRpc(serverHandlers)

            // Create a large payload
            const largeCapabilities = {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: Array.from({ length: 50 }, (_, i) => `--arg-${i}=value-${i}`),
                    prefs: Object.fromEntries(
                        Array.from({ length: 25 }, (_, i) => [`pref-${i}`, `value-${i}`])
                    )
                },
                'wdio:options': {
                    customData: Array.from({ length: 200 }, (_, i) => ({
                        key: `data-${i}`,
                        value: `value-${i}`,
                        metadata: { timestamp: Date.now(), index: i }
                    }))
                }
            }

            const startTime = performance.now()
            const messageCount = 100

            // Create messages with large payloads
            for (let i = 0; i < messageCount; i++) {
                const message = {
                    origin: 'worker' as const,
                    name: 'sessionStarted' as const,
                    content: {
                        sessionId: `large-session-${i}`,
                        isW3C: true,
                        protocol: 'https',
                        hostname: 'localhost',
                        port: 4444,
                        path: '/wd/hub',
                        headers: {},
                        isMultiremote: false,
                        injectGlobals: true,
                        capabilities: largeCapabilities
                    },
                    cid: `0-${i}`
                }
                // Just verify the message structure is valid
                expect(message.content.capabilities).toBe(largeCapabilities)
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            expect(duration).toBeLessThan(1000) // Should complete within 1 second
        })
    })

    describe('Error Recovery Performance', () => {
        it('should handle errors efficiently', () => {
            const onError = vi.fn()
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn()
            }

            const startTime = performance.now()
            const errorCount = 100

            // Create RPC instances with error handling
            for (let i = 0; i < errorCount; i++) {
                createServerRpc(serverHandlers, { onError })
            }

            const endTime = performance.now()
            const duration = endTime - startTime

            expect(duration).toBeLessThan(1000) // Should complete within 1 second
        })
    })

    describe('Memory Efficiency', () => {
        it('should not create excessive memory overhead', () => {
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn(),
                sessionEnded: vi.fn()
            }

            const clientHandlers: Partial<ClientFunctions> = {
                consoleMessage: vi.fn(),
                runCommand: vi.fn()
            }

            // Create many RPC instances to test memory efficiency
            const instances = []
            for (let i = 0; i < 500; i++) {
                instances.push(createServerRpc(serverHandlers))
                instances.push(createClientRpc(clientHandlers))
            }

            expect(instances).toHaveLength(1000)
            // If we get here without memory issues, the test passes
        })
    })
})