import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'

import {
    createProcessRpcTransport,
    createWorkerRpcTransport,
    resolveTransport,
    isBirpcFrame,
    WORKER_RPC_EVENT,
} from '../src/transport.js'
import { createClientRpc, createServerRpc } from '../src/index.js'

describe('isBirpcFrame', () => {
    it('detects birpc request frames', () => {
        expect(isBirpcFrame({ m: 'foo', a: [], t: 'q', i: '1' })).toBe(true)
    })

    it('detects birpc response frames', () => {
        expect(isBirpcFrame({ t: 's', i: '1', r: 42 })).toBe(true)
    })

    it('does not flag legacy worker messages', () => {
        expect(isBirpcFrame({ origin: 'reporter', name: 'dot', content: 'x' })).toBe(false)
    })

    it('does not flag typed IPC envelopes', () => {
        expect(isBirpcFrame({ type: 5, value: {} })).toBe(false)
    })

    it('handles non-object payloads', () => {
        expect(isBirpcFrame(null)).toBe(false)
        expect(isBirpcFrame('q')).toBe(false)
        expect(isBirpcFrame(undefined)).toBe(false)
    })
})

describe('createProcessRpcTransport', () => {
    const mockSend = vi.fn()
    const mockOn = vi.fn()
    const mockOff = vi.fn()

    beforeEach(() => {
        vi.stubGlobal('process', {
            send: mockSend,
            on: mockOn,
            off: mockOff,
        } as unknown as NodeJS.Process)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    it('hides process.send behind post', () => {
        const transport = createProcessRpcTransport()
        transport.post('hello')
        expect(mockSend).toHaveBeenCalledWith('hello')
    })

    it('hides process.on behind on', () => {
        const transport = createProcessRpcTransport()
        const fn = vi.fn()
        transport.on(fn)
        expect(mockOn).toHaveBeenCalledWith('message', fn)
    })

    it('throws if process.send is unavailable', () => {
        vi.stubGlobal('process', { on: mockOn } as unknown as NodeJS.Process)
        const transport = createProcessRpcTransport()
        expect(() => transport.post('x')).toThrow('process.send not available')
    })

    it('resolveTransport("process") returns a process transport', () => {
        const transport = resolveTransport('process')
        transport.post('via-resolve')
        expect(mockSend).toHaveBeenCalledWith('via-resolve')
    })
})

describe('createWorkerRpcTransport', () => {
    function createWorker () {
        const worker = new EventEmitter() as EventEmitter & {
            childProcess?: { send: ReturnType<typeof vi.fn> }
        }
        worker.childProcess = { send: vi.fn() }
        return worker
    }

    it('hides childProcess.send behind post', () => {
        const worker = createWorker()
        const transport = createWorkerRpcTransport(worker)
        transport.post('payload')
        expect(worker.childProcess!.send).toHaveBeenCalledWith('payload')
    })

    it('throws when childProcess is not available', () => {
        const worker = createWorker()
        delete worker.childProcess
        const transport = createWorkerRpcTransport(worker)
        expect(() => transport.post('payload')).toThrow('childProcess is not available')
    })

    it('registers handlers on the dedicated worker rpc event', () => {
        const worker = createWorker()
        const transport = createWorkerRpcTransport(worker)
        const fn = vi.fn()
        transport.on(fn)
        worker.emit(WORKER_RPC_EVENT, { t: 'q' })
        expect(fn).toHaveBeenCalledWith({ t: 'q' })
    })

    it('dispose removes all registered listeners', () => {
        const worker = createWorker()
        const transport = createWorkerRpcTransport(worker)
        const fn = vi.fn()
        transport.on(fn)
        expect(worker.listenerCount(WORKER_RPC_EVENT)).toBe(1)

        transport.dispose?.()
        expect(worker.listenerCount(WORKER_RPC_EVENT)).toBe(0)

        worker.emit(WORKER_RPC_EVENT, { t: 'q' })
        expect(fn).not.toHaveBeenCalled()
    })

    it('off removes a single listener', () => {
        const worker = createWorker()
        const transport = createWorkerRpcTransport(worker)
        const fn = vi.fn()
        transport.on(fn)
        transport.off?.(fn)
        expect(worker.listenerCount(WORKER_RPC_EVENT)).toBe(0)
    })
})

describe('RPC round trip over custom transports', () => {
    it('lets a server call a client function and receive the result', async () => {
        /**
         * wire two in-memory channels together to simulate parent <-> child IPC
         * without mocking birpc
         */
        let serverHandler: ((msg: unknown) => void) | undefined
        let clientHandler: ((msg: unknown) => void) | undefined

        const serverTransport = {
            post: (msg: unknown) => clientHandler?.(msg),
            on: (fn: (msg: unknown) => void) => { serverHandler = fn },
        }
        const clientTransport = {
            post: (msg: unknown) => serverHandler?.(msg),
            on: (fn: (msg: unknown) => void) => { clientHandler = fn },
        }

        interface Server { ping(value: string): string }
        interface Client { pong(value: string): string }

        const server = createServerRpc<Client, Server>(serverTransport, {
            ping: (value: string) => `server:${value}`,
        })
        createClientRpc<Server, Client>(clientTransport, {
            pong: (value: string) => `client:${value}`,
        })

        // server invokes the client function and awaits the response
        const result = await (server as unknown as Client).pong('hello')
        expect(result).toBe('client:hello')
    })
})
