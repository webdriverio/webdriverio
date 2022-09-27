import path from 'node:path'
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('got')
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
        it('should start wdio repl if in standalone mode', async () => {
            const repl = await browser.debug() as any
            expect(repl['_startFn']).toBeCalled()
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
                on: vi.fn()
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

            beforeEach(async () => {
                global.process.env.WDIO_WORKER_ID = '1'
                browser.debug()
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
            })

            it('should execute repl eval command', () => {
                messageHandlerCallback({
                    origin: 'debugger',
                    name: 'eval',
                    content: { cmd: '1+1' }
                })
            })
        })

        afterEach(() => {
            global.process = realProcess
            delete global.process.env.WDIO_WORKER_ID
        })
    })
})
