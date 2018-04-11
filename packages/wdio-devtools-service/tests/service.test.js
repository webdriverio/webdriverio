import DevToolsService from '../src'

import CDP from 'chrome-remote-interface'
import logger from 'wdio-logger'

const COMMAND_LINE_TEXT = `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --flag-switches-begin --site-per-process --flag-switches-end --remote-debugging-port=1234`

describe('WDIO DevTools Service', () => {
    it('enables support based on caps', () => {
        const service = new DevToolsService()
        expect(service.isSupported).toBe(false)

        service.beforeSession(null, { browserName: 'firefox' })
        expect(service.isSupported).toBe(false)
        service.beforeSession(null, { browserName: 'chrome', version: 62 })
        expect(service.isSupported).toBe(false)

        service.beforeSession(null, { browserName: 'chrome', version: 65 })
        expect(service.isSupported).toBe(true)
    })

    it('_getCDPClient', async () => {
        const service = new DevToolsService()
        const cdp = await service._getCDPClient(1234)
        expect(CDP.mock.calls).toHaveLength(1)
        expect(CDP.mock.calls[0][0].port).toBe(1234)
        expect(typeof cdp.on).toBe('function')
    })

    it('_findChromePort', async () => {
        const service = new DevToolsService()
        const elemMock = { getText: jest.fn().mockReturnValue(Promise.resolve(COMMAND_LINE_TEXT)) }
        global.browser = {
            url: jest.fn(),
            $: jest.fn().mockReturnValue(elemMock)
        }

        const result = await service._findChromePort()
        expect(global.browser.url.mock.calls).toHaveLength(1)
        expect(global.browser.$.mock.calls).toHaveLength(1)
        expect(elemMock.getText.mock.calls).toHaveLength(1)
        expect(result).toBe(1234)
    })

    it('_findChromePort failing', async () => {
        const service = new DevToolsService()
        global.browser = {
            url: jest.fn(),
            $: jest.fn().mockReturnValue(Promise.reject(new Error('foobar')))
        }

        const result = await service._findChromePort()
        expect(typeof result).toBe('undefined')
        expect(logger().error.mock.calls).toHaveLength(1)
    })

    describe('before', () => {
        it('if not supported by browser', async () => {
            global.browser = { addCommand: jest.fn() }

            const service = new DevToolsService()
            service.isSupported = false

            await service.before()
            expect(global.browser.addCommand.mock.calls).toHaveLength(1)
            expect(global.browser.addCommand.mock.calls[0][0]).toBe('cdp')
            expect(global.browser.addCommand.mock.calls[0][1].toString()).toContain('throw new Error')
        })

        describe('if supported by browser', async () => {
            let service

            beforeEach(async () => {
                global.browser = { emit: jest.fn() }
                global.browser.addCommand = (name, fn) => {
                    global.browser[name] = fn
                }

                service = new DevToolsService()
                service.isSupported = true
                service._findChromePort = jest.fn().mockReturnValue(1234)

                await service.before()
            })

            it('has registered function', () => {
                expect(typeof global.browser.cdp).toBe('function')
            })

            it('cdp command fails if domain does not exist', () => {
                expect.assertions(1)

                try {
                    global.browser.cdp('foobar', 'enable', {})
                } catch (e) {
                    expect(e.message).toContain('Domain "foobar" doesn\'t exist')
                }
            })

            it('cdp command fails if method does not exist', () => {
                expect.assertions(1)

                try {
                    global.browser.cdp('Network', 'foobar', {})
                } catch (e) {
                    expect(e.message).toContain('doesn\'t have a method called "foobar"')
                }
            })

            it('executes cdp command', async () => {
                const result = await global.browser.cdp('Network', 'enable', { foo: 'bar' })
                expect(result.foo).toBe('bar')
            })

            it('registeres cdpConnection', () => {
                expect(global.browser.cdpConnection()).toEqual({ host: 'foobarhost', port: 4321 })
            })

            it('listens to cdp events', () => {
                expect(service.client.on.mock.calls).toHaveLength(1)

                service.client.on.mock.calls[0][1]({
                    method: 'Network.loadingFinished',
                    params: { foo: 'bar' }
                })
                expect(global.browser.emit.mock.calls).toHaveLength(1)
                expect(global.browser.emit.mock.calls[0][0]).toBe('Network.loadingFinished')
                expect(global.browser.emit.mock.calls[0][1]).toEqual({ foo: 'bar' })

                service.client.on.mock.calls[0][1]({
                    params: { bar: 'foo' }
                })
                expect(global.browser.emit.mock.calls).toHaveLength(2)
                expect(global.browser.emit.mock.calls[1][0]).toBe('event')
                expect(global.browser.emit.mock.calls[1][1]).toEqual({ bar: 'foo' })
            })

            afterEach(() => {
                service.client.on.mockClear()
            })
        })

        afterEach(() => {
            delete global.browser
        })
    })

    afterEach(() => {
        logger().error.mockClear()
    })
})
