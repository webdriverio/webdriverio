import path from 'node:path'
// @ts-expect-error mock feature
import { instances, setThrowError, clearInstances, type ClientOptions } from 'ws'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import logger from '@wdio/logger'

import { listWebsocketCandidateUrls, createBidiConnection } from '../../src/node/bidi.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('dns/promises', () => ({
    default: {
        lookup: vi.fn().mockResolvedValue([{ address: '127.0.0.1' }, { address: '::1' }])
    }
}))

vi.mock('ws', () => {
    const instances: WebSocket[] = []
    let throwError: Error | undefined
    return {
        default: class WebSocketMock {
            wsUrl: string
            options: ClientOptions | undefined
            on = vi.fn()
            send = vi.fn()
            once = vi.fn()
            error = vi.fn()
            terminate = vi.fn()
            removeAllListeners = vi.fn()
            constructor(url: string, options?: ClientOptions) {
                instances.push(this as unknown as WebSocket)
                this.wsUrl = url
                this.options = options
                if (throwError) {
                    throw throwError
                }
            }
        },
        instances,
        clearInstances: () => {
            instances.length = 0
        },
        setThrowError: (error: Error) => {
            throwError = error
        }
    }
})

const log = logger('test')

describe('Bidi Node.js implementation', () => {
    beforeEach(() => {
        clearInstances()
    })

    it('listWebsocketCandidateUrls', async () => {
        const candidateUrls = await listWebsocketCandidateUrls('ws://foo/bar')
        expect(candidateUrls).toEqual([
            'ws://foo/bar',
            'ws://127.0.0.1/bar',
            'ws://::1/bar'
        ])
    })

    it('createBidiConnection', async () => {
        const wsPromise = createBidiConnection('ws://foo/bar')
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(instances.length).toBe(3)
        expect(instances[0].wsUrl).toBe('ws://foo/bar')
        expect(instances[1].wsUrl).toBe('ws://127.0.0.1/bar')
        expect(instances[2].wsUrl).toBe('ws://::1/bar')
        expect(instances[0].once).toHaveBeenCalledWith('open', expect.any(Function))
        expect(instances[1].once).toHaveBeenCalledWith('open', expect.any(Function))
        expect(instances[2].once).toHaveBeenCalledWith('open', expect.any(Function))

        instances[0].once.mock.calls[1][1](new Error('foo')) // error callback
        instances[1].once.mock.calls[0][1]() // success callback
        instances[2].once.mock.calls[1][1](new Error('bar')) // error callback

        const ws = await wsPromise as any
        expect(instances[0].terminate).toHaveBeenCalled()
        expect(instances[1].terminate).not.toHaveBeenCalled()
        expect(instances[2].terminate).toHaveBeenCalled()

        expect(ws.wsUrl).toBe('ws://127.0.0.1/bar')
        expect(log.info).toHaveBeenCalledWith(
            'Connected to Bidi protocol at ws://127.0.0.1/bar'
        )
        expect(log.error).not.toHaveBeenCalled()
    })

    it('createBidiConnection with options for the ws', async ()=>{
        const wsPromise = createBidiConnection('ws://foo/bar', { headers: { 'cf-access-token': 'MY_TOKEN', 'X-Custom': 'xyz' } })
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(instances.length).toBe(3)

        expect(instances[0].options).toStrictEqual({ headers: { 'cf-access-token': 'MY_TOKEN', 'X-Custom': 'xyz' } })
    })

    it('createBidiConnection returns undefined if no socket connection is established', async () => {
        const wsPromise = createBidiConnection('ws://foo/bar')
        await new Promise((resolve) => setTimeout(resolve, 100))
        setTimeout(() => instances[0].once.mock.calls[1][1](new Error('foo')), 300) // error callback
        setTimeout(() => instances[1].once.mock.calls[1][1](new Error('bar')), 100) // error callback
        setTimeout(() => instances[2].once.mock.calls[1][1](new Error('loo')), 200) // error callback
        await expect(wsPromise).resolves.toBeUndefined()
        expect(log.error).toBeCalledWith('Could not connect to Bidi protocol\n  - bar\n  - loo\n  - foo')
    })

    it('createBidiConnection times out', async () => {
        vi.useFakeTimers()
        const wsPromise = createBidiConnection('ws://foo/bar')
        vi.runAllTimersAsync()
        expect(await wsPromise).toBeUndefined()
        expect(log.error).toHaveBeenCalledWith(
            'Could not connect to Bidi protocol of any candidate url in time: ' +
            '"ws://foo/bar", "ws://127.0.0.1/bar", "ws://::1/bar"'
        )
    })

    it('should not fail if WebSocket url is invalid', async () => {
        setThrowError(new Error('ESERVFAIL'))
        const wsPromise = createBidiConnection('ws://foo/bar')
        expect(await wsPromise).toBeUndefined()
    })
})
