import path from 'node:path'
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest'
import WDIORepl from '@wdio/repl'
import { remote } from '../../../src/index.js'

import '../../../src/node.js'

vi.mock('fetch')
vi.mock('@wdio/repl', () => import(path.join(process.cwd(), '__mocks__', '@wdio/repl')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('debug command', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    describe('standalone mode', () => {
        it('should start wdio repl with local environment and require in standalone mode', async () => {
            const repl = await browser.debug() as any
            expect(repl['_startFn']).toBeCalled()
            const context = repl['_startFn'].mock.calls[0][0]
            expect(context.browser).toBe(browser)
            expect(context.driver).toBe(browser)
            expect(typeof context.$).toBe('function')
            expect(typeof context.$$).toBe('function')
            expect(typeof context.require).toBe('function')
            expect(typeof context.require.resolve).toBe('function')
            expect(typeof context.process).toBe('object')
            expect(typeof context.Buffer).toBe('function')
        })

        it('should expose custom context variables via options or positional argument', async () => {
            const pageObject = { open: vi.fn() }
            const replWithOpts = await browser.debug({
                commandTimeout: 10000,
                context: { pageObject, testUser: 'alice' }
            }) as any
            expect(replWithOpts['_config'].commandTimeout).toBe(10000)
            const ctxOpts = replWithOpts['_startFn'].mock.calls[0][0]
            expect(ctxOpts.pageObject).toBe(pageObject)
            expect(ctxOpts.testUser).toBe('alice')

            const replDirect = await browser.debug({ pageObject }) as any
            const ctxDirect = replDirect['_startFn'].mock.calls[0][0]
            expect(ctxDirect.pageObject).toBe(pageObject)

            const replPositional = await browser.debug(8000, { pageObject }) as any
            expect(replPositional['_config'].commandTimeout).toBe(8000)
            const ctxPositional = replPositional['_startFn'].mock.calls[0][0]
            expect(ctxPositional.pageObject).toBe(pageObject)
        })
    })

    describe('as wdio testrunner', () => {
        let realProcess: NodeJS.Process

        beforeEach(() => {
            realProcess = global.process
            global.process = {
                cwd: () => realProcess.cwd(),
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

        describe('on testrunner message', () => {
            let messageHandlerCallback: Function
            let loginPage: { submit: () => string }

            beforeEach(async () => {
                loginPage = { submit: () => 'ok' }
                global.process.env.WDIO_WORKER_ID = '1'
                browser.debug({ commandTimeout: 7500, context: { loginPage } })
                messageHandlerCallback = vi.mocked(global.process.on).mock.calls.pop()!.pop() as any
            })

            it('should do nothing if no debugger origin', () => {
                messageHandlerCallback({ origin: 'foobar' })
                messageHandlerCallback({ origin: 'debugger', name: 'foobar' })
            })

            it('should stop debugging process on stop', () => {
                messageHandlerCallback({ origin: 'debugger', name: 'stop' })
                // @ts-expect-error internal var
                expect(global.process._debugEnd).toBeCalledWith(process.pid)
                expect(global.process.off).toBeCalledWith('message', messageHandlerCallback)
            })

            it('should execute repl eval command with require and custom context', () => {
                const evalSpy = vi.spyOn(WDIORepl.prototype, 'eval')
                messageHandlerCallback({
                    origin: 'debugger',
                    name: 'eval',
                    content: { cmd: '1+1' }
                })
                expect(evalSpy).toHaveBeenCalledTimes(1)
                const [cmd, evalContext, filename, callback] = evalSpy.mock.calls[0]
                expect(cmd).toBe('1+1')
                expect(filename).toBeUndefined()
                expect(evalContext.browser).toBe(browser)
                expect(evalContext.driver).toBe(browser)
                expect(evalContext.loginPage).toBe(loginPage)
                expect(typeof evalContext.require).toBe('function')

                vi.mocked(global.process.send!).mockClear()
                callback(null, 2)
                expect(global.process.send).toHaveBeenCalledTimes(1)
                expect(global.process.send).toHaveBeenCalledWith({
                    origin: 'debugger',
                    name: 'result',
                    params: { result: 2 }
                })

                vi.mocked(global.process.send!).mockClear()
                callback(null, function sampleHelper() {})
                expect(global.process.send).toHaveBeenCalledWith({
                    origin: 'debugger',
                    name: 'result',
                    params: { result: '[Function: sampleHelper]' }
                })

                vi.mocked(global.process.send!).mockClear()
                callback(new Error('eval failed'), undefined)
                expect(global.process.send).toHaveBeenCalledTimes(1)
                expect(global.process.send).toHaveBeenCalledWith({
                    origin: 'debugger',
                    name: 'result',
                    params: expect.objectContaining({
                        error: true,
                        message: 'eval failed'
                    })
                })
                evalSpy.mockRestore()
            })
        })

        afterEach(() => {
            global.process = realProcess
            delete global.process.env.WDIO_WORKER_ID
        })
    })
})
