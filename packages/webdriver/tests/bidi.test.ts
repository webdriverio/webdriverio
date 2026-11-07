import path from 'node:path'
import { logMock } from '../../../__mocks__/@wdio/logger.js'
import { describe, it, vi, expect, beforeAll, afterAll } from 'vitest'

import '../src/node.js'
import { BIDI_MASK, BIDI_SCRIPT_TIMEOUT, BidiCore, MAX_EXPIRED_COMMANDS, maskBidiCommand, parseBidiCommand } from '../src/bidi/core.js'
import { environment } from '../src/environment.js'
import { SESSION_ENDED_ERROR } from '../src/constants.js'
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
    off: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    terminate: vi.fn()
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

        it('rejects a non-positive connectTimeout', () => {
            for (const timeout of [0, -1, NaN, Infinity]) {
                expect(() => new BidiCore('ws://foo/bar', undefined, undefined, timeout)).toThrow(
                    'The option "bidiConnectTimeout" needs to be a positive number'
                )
            }
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
            expect(error.stack).toMatch(/packages[\\/]webdriver[\\/]tests[\\/]bidi\.test\.ts:135:/)
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

        it('rejects a command with a script timeout when its params set one', async () => {
            vi.useFakeTimers()
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()

            const params = { functionDeclaration: '() => {}', [BIDI_SCRIPT_TIMEOUT]: 1000 }
            const promise = handler.send({ method: 'script.callFunction', params } as any)
            const error = promise.catch((err: Error) => err)
            await vi.advanceTimersByTimeAsync(999)
            await vi.advanceTimersByTimeAsync(1)
            expect(await error).toMatchObject({
                name: 'script timeout',
                message: expect.stringContaining('did not finish within 1000ms')
            })
            expect(vi.mocked(handler.socket!.send).mock.calls[0][0]).not.toContain('1000')

            /**
             * the late result of the script is ignored
             */
            expect(() => deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: 1, result: 'late' })))).not.toThrow()
            vi.useRealTimers()
        })

        it('keeps at most MAX_EXPIRED_COMMANDS timed out commands to ignore', async () => {
            vi.useFakeTimers()
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()

            const count = MAX_EXPIRED_COMMANDS + 1
            const results = Array.from({ length: count }, () => handler.send({
                method: 'script.callFunction',
                params: { functionDeclaration: '() => {}', [BIDI_SCRIPT_TIMEOUT]: 10 }
            } as any).catch((err: Error) => err.name))
            await vi.advanceTimersByTimeAsync(10)
            expect(new Set(await Promise.all(results))).toEqual(new Set(['script timeout']))

            const { logMock } = await import('@wdio/logger') as unknown as { logMock: { error: ReturnType<typeof vi.fn> } }
            logMock.error.mockClear()
            /**
             * the newest expired command is still known, the oldest one was dropped
             */
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: count, result: 'late' })))
            expect(logMock.error).not.toHaveBeenCalled()
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: 1, result: 'late' })))
            expect(logMock.error).toHaveBeenCalledWith('Couldn\'t resolve command with id 1')
            vi.useRealTimers()
        })

        it('starts no script timer for a timeout that a timer cannot hold', async () => {
            vi.useFakeTimers()
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()

            /**
             * `setTimeout` fires at once for a delay above 2 ** 31 - 1 ms
             */
            for (const [id, scriptTimeout] of [[1, 2 ** 31], [2, Number.MAX_SAFE_INTEGER]] as const) {
                const params = { functionDeclaration: '() => {}', [BIDI_SCRIPT_TIMEOUT]: scriptTimeout }
                const promise = handler.send({ method: 'script.callFunction', params } as any)
                await vi.advanceTimersByTimeAsync(60_000)
                deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id, result: 'done' })))
                await expect(promise).resolves.toEqual({ id, result: 'done' })
            }
            vi.useRealTimers()
        })

        it('resolves a command that answers within its script timeout', async () => {
            vi.useFakeTimers()
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()

            const params = { functionDeclaration: '() => {}', [BIDI_SCRIPT_TIMEOUT]: 1000 }
            const promise = handler.send({ method: 'script.callFunction', params } as any)
            await vi.advanceTimersByTimeAsync(999)
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: 1, result: 'foobar' })))
            await expect(promise).resolves.toEqual({ id: 1, result: 'foobar' })
            await vi.advanceTimersByTimeAsync(5000)
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
                expect.objectContaining({ headers: { 'cf-access-token': 'MY_TOKEN', 'X-Custom': 'xyz' } }),
                undefined
            )
        })

        it('should pass the connect timeout to the connection, also on reconnect', async () => {
            const handler = new BidiCore('ws://foo/bar', undefined, undefined, 30000)
            await handler.connect()
            expect(environment.value.createBidiConnection).toHaveBeenLastCalledWith('ws://foo/bar', undefined, 30000)
            await handler.reconnect('ws://foo/baz')
            expect(environment.value.createBidiConnection).toHaveBeenLastCalledWith('ws://foo/baz', undefined, 30000)
        })

        afterAll(() => {
            process.env.WDIO_UNIT_TESTS = '1'
        })
    })

    describe('close', () => {
        beforeAll(() => {
            delete process.env.WDIO_UNIT_TESTS
        })

        /**
         * the listener `BidiCore.connect` registers for a socket event
         */
        const listenerOf = (handler: BidiCore | { on: unknown }, event: string) => {
            const socket = 'socket' in handler ? handler.socket : handler
            const registration = vi.mocked((socket as { on: (...args: unknown[]) => unknown }).on).mock.calls.find(([name]) => name === event)
            return registration?.[1] as ((...args: unknown[]) => void) | undefined
        }

        it('rejects a pending command at once when the session closes the connection (#16051)', async () => {
            vi.useFakeTimers()
            try {
                const handler = new BidiCore('ws://foo/bar')
                await handler.connect()
                const error = handler.send({ method: 'browsingContext.captureScreenshot', params: {} }).catch((err: Error) => err)

                handler.close()
                await vi.advanceTimersByTimeAsync(0)

                expect((await error).message).toBe(
                    'WebDriver Bidi command "browsingContext.captureScreenshot" with id 1 got no result: the connection was closed'
                )
                expect(vi.getTimerCount()).toBe(0)
            } finally {
                vi.useRealTimers()
            }
        })

        it('rejects a pending command at once when the browser or driver closes the socket', async () => {
            vi.useFakeTimers()
            try {
                const handler = new BidiCore('ws://foo/bar')
                await handler.connect()
                const error = handler.send({ method: 'browsingContext.getTree', params: {} }).catch((err: Error) => err)

                listenerOf(handler, 'close')?.(1006)
                await vi.advanceTimersByTimeAsync(0)

                expect((await error).message).toBe(
                    'WebDriver Bidi command "browsingContext.getTree" with id 1 got no result: the browser or the driver closed the connection (code 1006)'
                )
                expect(vi.getTimerCount()).toBe(0)
                expect(handler.isConnected).toBe(false)
            } finally {
                vi.useRealTimers()
            }
        })

        it('gives the error the stack of the line that sent the command', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const error = handler.send({ method: 'session.status', params: {} }).catch((err: Error) => err)
            /**
             * not from this file: in real use `deleteSession` closes the connection
             */
            setTimeout(handler.close.bind(handler), 0)

            expect((await error).stack).toMatch(/packages[\\/]webdriver[\\/]tests[\\/]bidi\.test\.ts:\d+:/)
        })

        it('rejects the pending commands also with a socket that has no terminate(), as in the browser', async () => {
            vi.mocked(environment.value.createBidiConnection).mockResolvedValueOnce({
                on: vi.fn(),
                off: vi.fn(),
                send: vi.fn(),
                close: vi.fn()
            } as never)
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const error = handler.send({ method: 'session.status', params: {} }).catch((err: Error) => err)

            expect(() => handler.close()).not.toThrow()

            expect((await error).message).toBe('WebDriver Bidi command "session.status" with id 1 got no result: the connection was closed')
            expect(handler.socket).toBeUndefined()
        })

        it('names the error of a pending command that the connection close rejects', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const byClose = handler.send({ method: 'session.status', params: {} }).catch((err: Error) => err)
            handler.close()
            expect((await byClose)?.name).toBe(SESSION_ENDED_ERROR)

            await handler.connect()
            const bySocket = handler.send({ method: 'session.status', params: {} }).catch((err: Error) => err)
            listenerOf(handler, 'close')?.(1006)
            expect((await bySocket)?.name).toBe(SESSION_ENDED_ERROR)
        })

        it('is closed after the connection closed, until it connects again', async () => {
            const handler = new BidiCore('ws://foo/bar')
            expect(handler.isClosed).toBe(false)
            await handler.connect()
            expect(handler.isClosed).toBe(false)

            handler.close()
            expect(handler.isClosed).toBe(true)

            await handler.connect()
            expect(handler.isClosed).toBe(false)
            listenerOf(handler, 'close')?.(1006)
            expect(handler.isClosed).toBe(true)
        })

        it('names the error of a command sent after the close, not of a command sent before any connection', async () => {
            const handler = new BidiCore('ws://foo/bar')
            const beforeConnect = (() => { try { handler.sendAsync({ method: 'session.status', params: {} }) } catch (err) { return err as Error } })()
            expect(beforeConnect?.message).toBe('No connection to WebDriver Bidi was established')
            expect(beforeConnect?.name).toBe('Error')

            await handler.connect()
            handler.close()
            const afterClose = (() => { try { handler.sendAsync({ method: 'session.status', params: {} }) } catch (err) { return err as Error } })()
            expect(afterClose?.message).toBe('No connection to WebDriver Bidi was established')
            expect(afterClose?.name).toBe(SESSION_ENDED_ERROR)
        })

        it('acts like a connection that could not be made after discard', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const socket = handler.socket!
            handler.discard()
            expect(socket.close).toHaveBeenCalled()
            expect(handler.isConnected).toBe(false)
            expect(handler.isClosed).toBe(false)
            const afterDiscard = (() => { try { handler.sendAsync({ method: 'session.status', params: {} }) } catch (err) { return err as Error } })()
            expect(afterDiscard?.message).toBe('No connection to WebDriver Bidi was established')
            expect(afterDiscard?.name).toBe('Error')
        })

        it('is not closed after discard, also when the server closed the socket during the check', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            listenerOf(handler, 'close')?.(1006)
            expect(handler.isClosed).toBe(true)
            handler.discard()
            expect(handler.isClosed).toBe(false)
        })

        it('ignores the close event of the socket of an earlier connection', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const oldSocket = handler.socket!
            await handler.reconnect('ws://foo/baz')
            const pending = handler.send({ method: 'session.status', params: {} })

            listenerOf(oldSocket as never, 'close')?.(1000)
            deliverBidiMessage(handler, Buffer.from(JSON.stringify({ id: 1, result: 'foobar' })))

            await expect(pending).resolves.toEqual({ id: 1, result: 'foobar' })
            expect(handler.isConnected).toBe(true)
        })

        it('removes its socket listeners when it closes the connection', async () => {
            const handler = new BidiCore('ws://foo/bar')
            await handler.connect()
            const socket = handler.socket!
            const onMessage = listenerOf(handler, 'message')
            const onClose = listenerOf(handler, 'close')

            handler.close()

            expect(socket.off).toHaveBeenCalledWith('message', onMessage)
            expect(socket.off).toHaveBeenCalledWith('close', onClose)
        })

        afterAll(() => {
            process.env.WDIO_UNIT_TESTS = '1'
        })
    })

    describe('connect', () => {
        it('stops waiting for the connection when it can not connect (#16240)', async () => {
            vi.mocked(environment.value.createBidiConnection).mockRejectedValueOnce(new TypeError('Invalid URL'))
            const handler = new BidiCore('not a url')
            await expect(handler.connect()).rejects.toThrow('Invalid URL')
            await expect(handler.waitForConnected()).resolves.toBe(false)
            expect(handler.isConnected).toBe(false)
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
            const logged = JSON.stringify(logMock.info.mock.calls.filter(([tag]) => tag === 'BIDI COMMAND'))
            expect(logged).toContain('**MASKED**')
            expect(logged).not.toContain('"value\\":\\"s')
            expect(emit).toHaveBeenCalledWith('bidiCommand', {
                id: 1,
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