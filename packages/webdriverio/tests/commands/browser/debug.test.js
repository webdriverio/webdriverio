import { remote } from '../../../src'

describe('debug command', () => {
    let browser

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
            const repl = await browser.debug()
            expect(repl._startFn).toBeCalled()
        })
    })

    describe('as wdio testrunner', () => {
        let realProcess

        beforeEach(() => {
            realProcess = global.process
            global.process = {
                env: { WDIO_WORKER: false },
                _debugProcess: jest.fn(),
                _debugEnd: jest.fn(),
                send: jest.fn(),
                on: jest.fn()
            }
        })

        it('should send debugger start command to wdio testrunner', () => {
            global.process.env.WDIO_WORKER = true
            browser.debug()
            expect(global.process.send).toBeCalledWith({
                origin: 'debugger',
                name: 'start',
                params: { commandTimeout: 5000, introMessage: 'some intro from mock' }
            })
            expect(global.process._debugProcess).toBeCalledWith(process.pid)
        })

        describe('on testrunner message', () => {
            let messageHandlerCallback

            beforeEach(async () => {
                global.process.env.WDIO_WORKER = true
                browser.debug()
                messageHandlerCallback = global.process.on.mock.calls.pop().pop()
            })

            it('should do nothing if no debugger origin', () => {
                messageHandlerCallback({ origin: 'foobar' })
                messageHandlerCallback({ origin: 'debugger', name: 'foobar' })
            })

            it('should stop debugging process on stop', () => {
                messageHandlerCallback({ origin: 'debugger', name: 'stop' })
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
            delete global.process.env.WDIO_WORKER
        })
    })
})
