import path from 'node:path'
import { describe, it, vi, expect } from 'vitest'
import { BidiCore } from '../src/bidi/core.js'

vi.mock('ws')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('BidiCore', () => {
    it('iniates with a WebSocket', () => {
        const handler = new BidiCore('ws://foo/bar')
        // @ts-expect-error "wsUrl" is a mock property
        expect(handler.socket.wsUrl).toBe('ws://foo/bar')
        expect(handler.isConnected).toBe(false)
    })

    it('can connect', async () => {
        const handler = new BidiCore('ws://foo/bar')
        handler.connect()
        expect(handler.socket.on).toBeCalledWith('open', expect.any(Function))

        const [, cb] = vi.mocked(handler.socket.on).mock.calls[0]
        cb.call(this as  any)
        expect(handler.isConnected).toBe(true)
    })

    describe('send', () => {
        it('fails if sending a message while not connected', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await expect(async () => handler.send({ method: 'session.new', params: {} }))
                .rejects.toMatchSnapshot()
        })

        it('sends and waits for result', async () => {
            const handler = new BidiCore('ws://foo/bar')
            handler.connect()
            const [, cb] = vi.mocked(handler.socket.on).mock.calls[0]
            cb.call(this as  any)

            vi.mocked(handler.socket.on).mockClear()
            const promise = handler.send({ method: 'session.new', params: {} })
            expect(handler.socket.on).toBeCalledWith('message', expect.any(Function))
            const [, messageCallback] = vi.mocked(handler.socket.on).mock.calls[0]

            messageCallback.call(this as any, Buffer.from('{somewrongmessage'))
            messageCallback.call(this as any, Buffer.from(JSON.stringify({ id: 1, result: 'foobar' })))
            const result = await promise
            expect(result).toEqual({ id: 1, result: 'foobar' })
        })

        it('has a proper error stack that contains the line where the command is called', async () => {
            const handler = new BidiCore('ws://foo/bar')
            handler.connect()
            const [, cb] = vi.mocked(handler.socket.on).mock.calls[0]
            cb.call(this as  any)

            const promise = handler.send({ method: 'session.new', params: {} })
            const [, messageCallback] = vi.mocked(handler.socket.on).mock.calls[1]
            setTimeout(
                () => messageCallback.call(this as any, Buffer.from(JSON.stringify({ id: 1, error: 'foobar' }))),
                100
            )

            const error = await promise.catch((err) => err)
            const errorMessage = 'WebDriver Bidi command "session.new" failed with error: foobar'
            expect(error.stack).toContain(path.join('packages', 'webdriver', 'tests', 'bidi.test.ts:56:'))
            expect(error.stack).toContain(errorMessage)
            expect(error.message).toBe(errorMessage)
        })
    })

    describe('sendAsync', () => {
        it('fails if sending a message while not connected', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await expect(async () => handler.sendAsync({ method: 'session.new', params: {} }))
                .rejects.toMatchSnapshot()
        })

        it('can send without getting an result', async () => {
            const handler = new BidiCore('ws://foo/bar')
            handler.connect()
            const [, cb] = vi.mocked(handler.socket.on).mock.calls[0]
            cb.call(this as  any)

            expect(handler.sendAsync({ method: 'session.new', params: {} }))
                .toEqual(1)
            expect(vi.mocked(handler.socket.send).mock.calls).toMatchSnapshot()
        })
    })
})
