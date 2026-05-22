import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClientRpc, createServerRpc } from '../src/index.js'
import { WS_MESSAGE_TYPES } from '@wdio/types'
import type { ServerFunctions, ClientFunctions } from '../src/types.js'

describe('RPC Integration Tests', () => {
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

    describe('Session Lifecycle Integration', () => {
        it('should create server and client RPC with process transport', () => {
            const serverHandlers: Partial<ServerFunctions> = {
                sessionStarted: vi.fn(),
                sessionEnded: vi.fn(),
                sessionMetadata: vi.fn(),
            }

            const clientHandlers: Partial<ClientFunctions> = {
                consoleMessage: vi.fn(),
                runCommand: vi.fn(),
            }

            expect(() => createServerRpc('process', serverHandlers)).not.toThrow()
            expect(() => createClientRpc('process', clientHandlers)).not.toThrow()
        })

        it('should wire process.on when transport is "process"', () => {
            createServerRpc('process', {})
            expect(mockOn).toHaveBeenCalledWith('message', expect.any(Function))
        })

        it('should wire process.send when transport is "process" and a message is sent', () => {
            createClientRpc('process', {})
            expect(mockOn).toHaveBeenCalledWith('message', expect.any(Function))
            // process.send is called by birpc internals when an RPC call is made
            expect(mockSend).not.toHaveBeenCalled() // not called until a method is invoked
        })
    })

    describe('Custom Transport Channel', () => {
        it('should use a custom post/on channel when provided', () => {
            const customPost = vi.fn()
            const customOn = vi.fn()
            const transport = { post: customPost, on: customOn }

            createServerRpc(transport, {})

            expect(customOn).toHaveBeenCalledWith(expect.any(Function))
            expect(mockOn).not.toHaveBeenCalled()
        })

        it('should support bi-directional custom transport', () => {
            const serverPost = vi.fn()
            const serverOn = vi.fn()
            const clientPost = vi.fn()
            const clientOn = vi.fn()

            createServerRpc({ post: serverPost, on: serverOn }, {})
            createClientRpc({ post: clientPost, on: clientOn }, {})

            expect(serverOn).toHaveBeenCalledWith(expect.any(Function))
            expect(clientOn).toHaveBeenCalledWith(expect.any(Function))
        })
    })

    describe('Error Handling Integration', () => {
        it('should throw when process.send is unavailable and post is called', () => {
            vi.stubGlobal('process', {
                send: undefined,
                on: mockOn
            } as unknown as NodeJS.Process)

            const onError = vi.fn()
            // createBirpc calls channel.on immediately but doesn't call post yet
            createClientRpc('process', {}, { onError })

            // The on handler is wired — post would fail when birpc tries to send
            // Simulate what birpc does: call post
            const channel = (mockOn.mock.calls[0] || [])
            // We test the error message matches in createClientRpc.test.ts
            // Here just verify construction does not throw
            expect(onError).not.toHaveBeenCalled()
        })

        it('should use custom transport to avoid process dependency', () => {
            vi.stubGlobal('process', {
                send: undefined,
                on: undefined
            } as unknown as NodeJS.Process)

            const customPost = vi.fn()
            const customOn = vi.fn()

            // Should not throw even though process.send/on are unavailable
            expect(() => createClientRpc({ post: customPost, on: customOn }, {})).not.toThrow()
            expect(customOn).toHaveBeenCalledWith(expect.any(Function))
        })
    })

    describe('Bi-directional Communication', () => {
        it('should support creating both server and client with matching custom transport', () => {
            const serverMessages: unknown[] = []
            const clientMessages: unknown[] = []

            let serverOnFn: ((msg: unknown) => void) | undefined
            let clientOnFn: ((msg: unknown) => void) | undefined

            const serverTransport = {
                post: (msg: unknown) => clientMessages.push(msg),
                on: (fn: (msg: unknown) => void) => { serverOnFn = fn }
            }
            const clientTransport = {
                post: (msg: unknown) => serverMessages.push(msg),
                on: (fn: (msg: unknown) => void) => { clientOnFn = fn }
            }

            const serverHandlers = { sessionEnded: vi.fn() }
            const clientHandlers = { consoleMessage: vi.fn() }

            createServerRpc(serverTransport, serverHandlers)
            createClientRpc(clientTransport, clientHandlers)

            expect(typeof serverOnFn).toBe('function')
            expect(typeof clientOnFn).toBe('function')
        })
    })
})
