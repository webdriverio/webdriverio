import path from 'node:path'
import { describe, it, vi, expect, beforeAll, afterAll } from 'vitest'

import '../src/node.js'
import { BIDI_MASK, BidiCore, maskBidiCommand, parseBidiCommand } from '../src/bidi/core.js'
import { environment } from '../src/environment.js'
import '../src/browser.js'

import { type BrowserSocket } from '../src/bidi/socket.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/bidi/socket.js', () => {
    const instances: BrowserSocket[] = []
    return {
        BrowserSocket: class {
            wsUrl: string
            opts: any

            on = vi.fn()
            send = vi.fn()

            constructor(url: string, opts: any) {
                this.wsUrl = url
                this.opts = opts
            }
        },
        instances
    }
})

environment.value.createBidiConnection = vi.fn().mockImplementation(async (url: string) => ({
    wsUrl: url,
    on: vi.fn(),
    send: vi.fn()
}))

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

/**
 * Deliver a socket payload through the listener `BidiCore.connect` registers.
 * That is the production path; there is no test-only response hook.
 */
function deliverBidiMessage (handler: BidiCore, data: Buffer) {
    const registration = vi.mocked(handler.socket?.on)?.mock.calls.find(([event]) => event === 'message')
    if (!registration) {
        throw new Error('BidiCore did not register a socket "message" listener')
    }
    const listener = registration[1] as (payload: Buffer) => void
    listener(data)
}

describe('BidiCore', () => {
    describe('can connect', () => {
        beforeAll(() => {
            delete process.env.WDIO_UNIT_TESTS
        })

        it('can connect', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            expect(environment.value.createBidiConnection).toBeCalledTimes(1)
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

        it('rejects a non-positive responseTimeout', () => {
            expect(() => new BidiCore('ws://foo/bar', undefined, 0)).toThrow(
                'The option "bidiResponseTimeout" needs to be a positive number'
            )
            expect(() => new BidiCore('ws://foo/bar', undefined, -1)).toThrow(
                'The option "bidiResponseTimeout" needs to be a positive number'
            )
            expect(() => new BidiCore('ws://foo/bar', undefined, NaN)).toThrow(
                'The option "bidiResponseTimeout" needs to be a positive number'
            )
        })

        it('sends and waits for result', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const promise = handler.send({ method: 'session.new', params: {} })

            deliverBidiMessage(handler, Buffer.from('{somewrongmessage'))
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: 1, result: 'foobar' })))
            await expect(promise).resolves.toEqual({ id: 1, result: 'foobar' })
        })

        it('has a proper error stack that contains the line where the command is called', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const promise = handler.send({ method: 'session.new', params: {} })
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({
                id: 1,
                error: 'foobar',
                message: 'I am an error!'
            })))

            const error = await promise.catch((err) => err)
            const errorMessage = 'WebDriver Bidi command "session.new" failed with error: foobar - I am an error!'
            expect(error.stack).toMatch(/packages[\\/]webdriver[\\/]tests[\\/]bidi\.test\.ts:123:/)
            expect(error.stack).toContain(errorMessage)
            expect(error.message).toBe(errorMessage)
        })

        it('times out if the browser does not respond in time', async () => {
            vi.useFakeTimers()
            const handler = new BidiCore('ws://foo/bar', undefined, 1000)
            await handler.connect()

            const promise = handler.send({ method: 'session.new', params: {} })
            const error = promise.catch((err: Error) => err)
            await vi.advanceTimersByTimeAsync(1000)
            expect((await error).message).toContain('timed out after 1000ms')

            /**
             * a late response should not resolve the already rejected command
             */
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: 1, result: 'foobar' })))
            vi.useRealTimers()
        })

        it('does not time out before the configured response timeout', async () => {
            vi.useFakeTimers()
            const handler = new BidiCore('ws://foo/bar', undefined, 100000)
            await handler.connect()

            const promise = handler.send({ method: 'session.new', params: {} })
            await vi.advanceTimersByTimeAsync(90000)
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: 1, result: 'foobar' })))
            await expect(promise).resolves.toEqual({ id: 1, result: 'foobar' })
            vi.useRealTimers()
        })

        it('should pass custom headers to Bidi Core', async () => {
            const handler = new BidiCore('ws://foo/bar', { headers: { 'cf-access-token': 'MY_TOKEN', 'X-Custom': 'xyz' } })
            await handler.connect()
            expect(environment.value.createBidiConnection).toHaveBeenCalledWith(
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
            await handler.connect()

            expect(handler.sendAsync({ method: 'session.new', params: {} }))
                .toEqual(1)
            expect(vi.mocked(handler.socket?.send)?.mock.calls).toMatchSnapshot()
        })

        it('sends masked params unchanged and emits them masked', async () => {
            const handler = new BidiCore('ws://foo/bar')
            const emit = vi.fn()
            handler.attachClient({ emit } as never)
            await handler.connect()

            const params = {
                context: 'frame-1',
                actions: [{
                    id: 'keyboard',
                    type: 'key' as const,
                    actions: [{ type: 'keyDown' as const, value: 's' }, { type: 'keyUp' as const, value: 's' }]
                }],
                [BIDI_MASK]: true
            }
            handler.sendAsync({ method: 'input.performActions', params })

            const sent = JSON.parse(vi.mocked(handler.socket?.send)!.mock.calls[0][0] as string)
            expect(sent.params.actions[0].actions[0].value).toBe('s')
            expect(emit).toHaveBeenCalledWith('bidiCommand', {
                method: 'input.performActions',
                params: {
                    context: 'frame-1',
                    actions: [{
                        id: 'keyboard',
                        type: 'key',
                        actions: [{ type: 'keyDown', value: '**MASKED**' }, { type: 'keyUp', value: '**MASKED**' }]
                    }],
                    [BIDI_MASK]: true
                }
            })
        })

        afterAll(() => {
            process.env.WDIO_UNIT_TESTS = '1'
        })
    })

    describe('maskBidiCommand', () => {
        it('returns the command as is without the mask symbol', () => {
            const command = { method: 'session.status', params: {} } as const
            expect(maskBidiCommand(command)).toBe(command)
        })

        it('hides all params of other masked commands', () => {
            expect(maskBidiCommand({
                method: 'script.callFunction',
                params: { functionDeclaration: otherFn, [BIDI_MASK]: true } as never
            })).toEqual({ method: 'script.callFunction', params: '**MASKED**' })
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