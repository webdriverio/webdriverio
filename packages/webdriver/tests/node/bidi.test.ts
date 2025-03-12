// @ts-expect-error mock feature
import { instances } from 'ws'
import { describe, it, expect, vi } from 'vitest'

import { listWebsocketCandidateUrls, createBidiConnection } from '../../src/node/bidi.js'

vi.mock('dns/promises', () => ({
    default: {
        resolve4: vi.fn().mockResolvedValue(['127.0.0.1']),
        resolve6: vi.fn().mockResolvedValue(['::1'])
    }
}))

vi.mock('ws', () => {
    const instances: WebSocket[] = []
    return {
        default: class WebSocketMock {
            wsUrl: string
            on = vi.fn()
            send = vi.fn()
            once = vi.fn()
            error = vi.fn()
            close = vi.fn()
            terminate = vi.fn()

            constructor(url: string) {
                instances.push(this as unknown as WebSocket)
                this.wsUrl = url
            }
        },
        instances
    }
})

describe('Bidi Node.js implementation', () => {
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

        console.log(11, instances[0].once.mock.calls[1][1])

        instances[0].once.mock.calls[1][1](new Error('foo')) // error callback
        instances[1].once.mock.calls[0][1]() // success callback
        instances[2].once.mock.calls[1][1](new Error('bar')) // error callback

        const ws = await wsPromise as any
        expect(instances[0].close).toHaveBeenCalled()
        expect(instances[1].close).not.toHaveBeenCalled()
        expect(instances[2].close).toHaveBeenCalled()

        expect(ws.wsUrl).toBe('ws://127.0.0.1/bar')
    })
})
