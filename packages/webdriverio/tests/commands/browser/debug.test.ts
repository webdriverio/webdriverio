import path from 'node:path'
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest'
import WDIORepl from '@wdio/repl'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/repl', () => import(path.join(process.cwd(), '__mocks__', '@wdio/repl')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('debug command', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(WDIORepl.createContext).mockClear()
        vi.mocked(WDIORepl.formatResult).mockClear()
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    describe('standalone mode', () => {
        it('should start wdio repl if in standalone mode with local environment context', async () => {
            const repl = await browser.debug() as any
            expect(repl['_startFn']).toBeCalled()
            expect(repl['_config'].commandTimeout).toBe(5000)
            expect(WDIORepl.createContext).toHaveBeenCalledWith(expect.objectContaining({
                browser,
                driver: browser,
                $: expect.any(Function),
                $$: expect.any(Function)
            }))
            expect(repl['_startFn']).toHaveBeenCalledWith(
                vi.mocked(WDIORepl.createContext).mock.results[0].value
            )
        })

        it('should accept options object with commandTimeout and local context', async () => {
            const loginPage = { submit: vi.fn() }
            const repl = await browser.debug({
                commandTimeout: 12000,
                context: { loginPage }
            }) as any
            expect(repl['_config'].commandTimeout).toBe(12000)
            expect(WDIORepl.createContext).toHaveBeenCalledWith(expect.objectContaining({
                browser,
                driver: browser,
                loginPage
            }))
        })

        it('should accept positional commandTimeout and context arguments', async () => {
            const helper = () => 'ok'
            const repl = await browser.debug(8000, { helper }) as any
            expect(repl['_config'].commandTimeout).toBe(8000)
            expect(WDIORepl.createContext).toHaveBeenCalledWith(expect.objectContaining({
                helper
            }))
        })

        it('should preserve live getters on passed context without eager evaluation', async () => {
            let calls = 0
            const context = {
                get value () {
                    calls++
                    return calls
                }
            }
            await browser.debug({ context })
            expect(calls).toBe(0)
            const passedLocals = vi.mocked(WDIORepl.createContext).mock.calls[0][0] as { value: number }
            expect(passedLocals.value).toBe(1)
            expect(passedLocals.value).toBe(2)
        })
    })

    describe('as wdio testrunner', () => {
        let realProcess: NodeJS.Process

        beforeEach(() => {
            realProcess = global.process
            global.process = {
                env: { WDIO_WORKER: false } as any,
                _debugProcess: vi.fn(),
                _debugEnd: vi.fn(),
                send: vi.fn(),
                on: vi.fn(),
                off: vi.fn()
            } as any
        })

        it('should send debugger start command to wdio testrunner', () => {
            global.process.env.WDIO_WORKER_ID = '1'
            browser.debug()
            expect(global.process.send).toBeCalledWith({
                origin: 'debugger',
                name: 'start',
                params: { commandTimeout: 5000, introMessage: 'some intro from mock' }
            })
            // @ts-expect-error internal var
            expect(global.process._debugProcess).toBeCalledWith(process.pid)
        })

        it('should pass commandTimeout and local context in options object to testrunner debugger', () => {
            global.process.env.WDIO_WORKER_ID = '1'
            const loginPage = { open: vi.fn() }
            browser.debug({ commandTimeout: 15000, context: { loginPage } })
            expect(global.process.send).toBeCalledWith({
                origin: 'debugger',
                name: 'start',
                params: { commandTimeout: 15000, introMessage: 'some intro from mock' }
            })
            expect(WDIORepl.createContext).toHaveBeenCalledWith(expect.objectContaining({
                browser,
                loginPage
            }))
        })

        describe('on testrunner message', () => {
            let messageHandlerCallback: Function
            let evalCallback: (err: Error | null, result: unknown) => void
            let evalSpy: ReturnType<typeof vi.fn>

            beforeEach(async () => {
                global.process.env.WDIO_WORKER_ID = '1'
                evalSpy = vi.spyOn(WDIORepl.prototype, 'eval').mockImplementation(
                    (_cmd: string, _ctx: unknown, _filename: unknown, cb: (err: Error | null, result: unknown) => void) => {
                        evalCallback = cb
                    }
                )
                browser.debug({ context: { customPage: { id: 1 } } })
                messageHandlerCallback = vi.mocked(global.process.on).mock.calls.pop()!.pop() as any
            })

            afterEach(() => {
                evalSpy.mockRestore()
            })

            it('should do nothing if no debugger origin', () => {
                messageHandlerCallback({ origin: 'foobar' })
                messageHandlerCallback({ origin: 'debugger', name: 'foobar' })
                expect(evalSpy).not.toHaveBeenCalled()
            })

            it('should stop debugging process and detach message listener on stop', () => {
                messageHandlerCallback({ origin: 'debugger', name: 'stop' })
                // @ts-expect-error internal var
                expect(global.process._debugEnd).toBeCalledWith(process.pid)
                expect(global.process.off).toHaveBeenCalledWith('message', messageHandlerCallback)
            })

            it('should execute repl eval command with local context and send result', () => {
                vi.mocked(global.process.send!).mockClear()
                messageHandlerCallback({
                    origin: 'debugger',
                    name: 'eval',
                    content: { cmd: '1+1' }
                })
                expect(evalSpy).toHaveBeenCalledWith(
                    '1+1',
                    expect.objectContaining({ customPage: { id: 1 } }),
                    undefined,
                    expect.any(Function)
                )
                evalCallback(null, 2)
                expect(global.process.send).toHaveBeenCalledTimes(1)
                expect(global.process.send).toHaveBeenCalledWith({
                    origin: 'debugger',
                    name: 'result',
                    params: { result: 2 }
                })
            })

            it('should send only a single error message when eval fails', () => {
                vi.mocked(global.process.send!).mockClear()
                messageHandlerCallback({
                    origin: 'debugger',
                    name: 'eval',
                    content: { cmd: 'throw new Error("boom")' }
                })
                evalCallback(new Error('boom'), undefined)
                expect(global.process.send).toHaveBeenCalledTimes(1)
                expect(global.process.send).toHaveBeenCalledWith(expect.objectContaining({
                    origin: 'debugger',
                    name: 'result',
                    params: expect.objectContaining({
                        error: true,
                        message: 'boom'
                    })
                }))
            })

            it('should fall back to WDIORepl.formatResult if IPC serialization fails', () => {
                vi.mocked(global.process.send!)
                    .mockClear()
                    .mockImplementationOnce(() => {
                        throw new TypeError('Converting circular structure to JSON')
                    })
                const circular: Record<string, unknown> = {}
                circular.self = circular

                messageHandlerCallback({
                    origin: 'debugger',
                    name: 'eval',
                    content: { cmd: 'process' }
                })
                evalCallback(null, circular)

                expect(WDIORepl.formatResult).toHaveBeenCalledWith(circular)
                expect(global.process.send).toHaveBeenCalledTimes(2)
                expect(global.process.send).toHaveBeenLastCalledWith({
                    origin: 'debugger',
                    name: 'result',
                    params: { result: String(circular) }
                })
            })

            it('should isolate sequential debug() sessions after stop detaches previous listener', async () => {
                const listeners = new Set<Function>()
                global.process.on = vi.fn((event: string, fn: Function) => {
                    if (event === 'message') {
                        listeners.add(fn)
                    }
                    return global.process
                }) as any
                global.process.off = vi.fn((event: string, fn: Function) => {
                    if (event === 'message') {
                        listeners.delete(fn)
                    }
                    return global.process
                }) as any

                const first = browser.debug({ context: { step: 1 } })
                expect(listeners.size).toBe(1)
                for (const fn of [...listeners]) {
                    fn({ origin: 'debugger', name: 'stop' })
                }
                await first
                expect(listeners.size).toBe(0)

                evalSpy.mockClear()
                const second = browser.debug({ context: { step: 2 } })
                expect(listeners.size).toBe(1)
                for (const fn of [...listeners]) {
                    fn({ origin: 'debugger', name: 'eval', content: { cmd: 'step' } })
                }
                expect(evalSpy).toHaveBeenCalledTimes(1)
                expect(evalSpy).toHaveBeenCalledWith(
                    'step',
                    expect.objectContaining({ step: 2 }),
                    undefined,
                    expect.any(Function)
                )
                for (const fn of [...listeners]) {
                    fn({ origin: 'debugger', name: 'stop' })
                }
                await second
                expect(listeners.size).toBe(0)
            })
        })

        afterEach(() => {
            global.process = realProcess
            delete global.process.env.WDIO_WORKER_ID
        })
    })
})
