import path from 'node:path'
import { describe, it, vi, expect, beforeAll, afterAll } from 'vitest'
import { WebSocket as ws } from 'ws'

import '../src/node.js'
import { BidiCore, parseBidiCommand } from '../src/bidi/core.js'

vi.mock('ws')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('ws', () => {
    const WS = vi.fn().mockImplementation((url: string) => ({
        wsUrl: url,
        on: vi.fn(),
        send: vi.fn()
    }))
    return {
        __esModule: true,
        default: WS,
        WebSocket: WS
    }
})

const namedFn = `function anonymous(
) {

        return (/* __wdio script__ */function checkVisibility(elem, params) {
    return elem.checkVisibility(params);
  }/* __wdio script end__ */).apply(this, arguments);

}`

const anonymousFn = `function anonymous(
) {

        return (/* __wdio script__ */(elem, params) => {
    return elem.checkVisibility(params);
  }/* __wdio script end__ */).apply(this, arguments);

}`
const otherFn = '(() => { ... }))()'

describe('BidiCore', () => {
    it('initiates with a WebSocket', () => {
        const handler = new BidiCore('ws://foo/bar')
        // @ts-expect-error "wsUrl" is a mock property
        expect(handler.socket.wsUrl).toBe('ws://foo/bar')
        expect(handler.isConnected).toBe(false)
    })

    describe('can connect', () => {
        beforeAll(() => {
            delete process.env.WDIO_UNIT_TESTS
        })

        it('can connect', async () => {
            const handler = new BidiCore('ws://foo/bar')
            handler.connect()
            expect(handler.socket.on).toBeCalledWith('open', expect.any(Function))
            const [, cb] = vi.mocked(handler.socket.on).mock.calls[1]
            cb.call(this as  any)
            expect(handler.isConnected).toBe(true)
        })

        afterAll(() => {
            process.env.WDIO_UNIT_TESTS = '1'
        })
    })

    describe('send', () => {
        beforeAll(() => {
            delete process.env.WDIO_UNIT_TESTS
        })

        it('fails if sending a message while not connected', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await expect(async () => handler.send({ method: 'session.new', params: {} }))
                .rejects.toMatchSnapshot()
        })

        it('sends and waits for result', async () => {
            const handler = new BidiCore('ws://foo/bar')
            handler.connect()
            const [, cb] = vi.mocked(handler.socket.on).mock.calls[1]
            cb.call(this as  any)

            vi.mocked(handler.socket.on).mockClear()
            const promise = handler.send({ method: 'session.new', params: {} })
            await new Promise((resolve) => setTimeout(resolve, 100))

            handler.__handleResponse.call(this as any, Buffer.from('{somewrongmessage'))
            handler.__handleResponse.call(this as any, Buffer.from(JSON.stringify({ id: 1, result: 'foobar' })))
            const result = await promise
            expect(result).toEqual({ id: 1, result: 'foobar' })
        })

        it('has a proper error stack that contains the line where the command is called', async () => {
            const handler = new BidiCore('ws://foo/bar')
            handler.connect()
            const [, cb] = vi.mocked(handler.socket.on).mock.calls[1]
            cb.call(this as  any)

            const promise = handler.send({ method: 'session.new', params: {} })
            setTimeout(
                () => handler.__handleResponse.call(this as any, Buffer.from(JSON.stringify({
                    id: 1,
                    error: 'foobar',
                    message: 'I am an error!'
                }))),
                100
            )

            const error = await promise.catch((err) => err)
            const errorMessage = 'WebDriver Bidi command "session.new" failed with error: foobar - I am an error!'
            expect(error.stack).toContain(path.join('packages', 'webdriver', 'tests', 'bidi.test.ts:102:'))
            expect(error.stack).toContain(errorMessage)
            expect(error.message).toBe(errorMessage)
        })

        it('should pass custom headers to Bidi Core', async () => {
            const handler = new BidiCore('ws://foo/bar', { headers: { 'cf-access-token': 'MY_TOKEN', 'X-Custom': 'xyz' } })
            expect(vi.mocked(ws)).toHaveBeenCalledWith(
                'ws://foo/bar',
                expect.objectContaining({ headers: { 'cf-access-token': 'MY_TOKEN', 'X-Custom': 'xyz' } })
            )
        })

        afterAll(() => {
            process.env.WDIO_UNIT_TESTS = '1'
        })
    })

    describe('sendAsync', () => {
        beforeAll(() => {
            delete process.env.WDIO_UNIT_TESTS
        })

        it('fails if sending a message while not connected', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await expect(async () => handler.sendAsync({ method: 'session.new', params: {} }))
                .rejects.toMatchSnapshot()
        })

        it('can send without getting an result', async () => {
            const handler = new BidiCore('ws://foo/bar')
            handler.connect()
            const [, cb] = vi.mocked(handler.socket.on).mock.calls[1]
            cb.call(this as  any)

            expect(handler.sendAsync({ method: 'session.new', params: {} }))
                .toEqual(1)
            expect(vi.mocked(handler.socket.send).mock.calls).toMatchSnapshot()
        })

        afterAll(() => {
            process.env.WDIO_UNIT_TESTS = '1'
        })
    })

    describe('parseBidiCommand', () => {
        it('exposes the function name if available', () => {
            expect(parseBidiCommand({
                method: 'script.callFunction',
                params: { functionDeclaration: namedFn }
            })[1]).toContain('<Function[200 bytes] checkVisibility>')
            expect(parseBidiCommand({
                method: 'script.callFunction',
                params: { functionDeclaration: anonymousFn }
            })[1]).toContain('<Function[179 bytes] anonymous>')
            expect(parseBidiCommand({
                method: 'script.callFunction',
                params: { functionDeclaration: otherFn }
            })[1]).toContain('<Function[18 bytes] anonymous>')
        })
    })
})
