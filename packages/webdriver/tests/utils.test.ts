import path from 'node:path'
import { URL } from 'node:url'
import type { MockedFunction } from 'vitest'
import { describe, it, expect, vi } from 'vitest'
import { transformCommandLogResult } from '@wdio/utils'
import type { Capabilities, Options } from '@wdio/types'

import {
    isSuccessfulResponse, getPrototype, getSessionError,
    getErrorFromResponseBody, CustomRequestError, startWebDriverSession,
    getTimeoutError,
    setupDirectConnect
} from '../src/utils.js'
import type { Client } from '../src/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/utils')
vi.mock('got')

describe('utils', () => {
    it('isSuccessfulResponse', () => {
        expect(isSuccessfulResponse(200, { value: { some: 'result' } })).toBe(true)
        expect(isSuccessfulResponse(404, { value: { error: new Error('foobar' ) } })).toBe(false)
        expect(isSuccessfulResponse(404, { value: { error: 'no such element' } })).toBe(true)
        expect(isSuccessfulResponse(404, { value: {
            message: 'An element could not be located on the page using the given search parameters.' }
        })).toBe(true)
        expect(isSuccessfulResponse(200, { status: 7, value: {} })).toBe(false)
        expect(isSuccessfulResponse(undefined, { status: 7, value: {} })).toBe(false)
        expect(isSuccessfulResponse(undefined, { status: 0, value: {} })).toBe(true)
        expect(isSuccessfulResponse(
            undefined,
            { status: 7, value: { message: 'no such element: foobar' } }
        )).toBe(true)
        expect(isSuccessfulResponse(
            200,
            { value: { message: 'Unable to find element with xpath == //foobar' } }
        )).toBe(true)
    })

    it('getPrototype', () => {
        const isW3C = false
        const isChromium = false
        const isMobile = false
        const isSauce = false
        const isIOS = false
        const isAndroid = false
        const isSeleniumStandalone = false

        const jsonWireProtocolPrototype = getPrototype({
            isW3C, isChromium, isMobile, isSauce, isSeleniumStandalone, isIOS, isAndroid
        })
        expect(jsonWireProtocolPrototype instanceof Object).toBe(true)
        expect(typeof jsonWireProtocolPrototype.sendKeys.value).toBe('function')
        expect(typeof jsonWireProtocolPrototype.sendCommand).toBe('undefined')
        expect(typeof jsonWireProtocolPrototype.lock).toBe('undefined')

        const webdriverPrototype = getPrototype({
            isW3C: true, isChromium, isMobile, isSauce, isSeleniumStandalone, isIOS, isAndroid
        })
        expect(webdriverPrototype instanceof Object).toBe(true)
        expect(typeof webdriverPrototype.sendKeys).toBe('undefined')
        expect(typeof webdriverPrototype.sendCommand).toBe('undefined')
        expect(typeof webdriverPrototype.performActions.value).toBe('function')
        expect(typeof webdriverPrototype.lock).toBe('undefined')

        const chromiumPrototype = getPrototype({
            isW3C: false, isChromium: true, isMobile, isSauce, isSeleniumStandalone, isIOS, isAndroid
        })
        expect(chromiumPrototype instanceof Object).toBe(true)
        expect(typeof chromiumPrototype.sendCommand.value).toBe('function')
        expect(typeof chromiumPrototype.getElementValue.value).toBe('function')
        expect(typeof chromiumPrototype.elementSendKeys.value).toBe('function')
        expect(typeof chromiumPrototype.lock).toBe('undefined')

        const geckoPrototype = getPrototype({
            isW3C: true, isChromium: false, isFirefox: true, isMobile, isSauce, isSeleniumStandalone, isIOS, isAndroid
        })
        expect(geckoPrototype instanceof Object).toBe(true)
        expect(typeof geckoPrototype.setMozContext.value).toBe('function')
        expect(typeof geckoPrototype.installAddOn.value).toBe('function')
        expect(typeof geckoPrototype.elementSendKeys.value).toBe('function')
        expect(typeof geckoPrototype.lock).toBe('undefined')

        const mobilePrototype = getPrototype({
            isW3C: true, isChromium: false, isMobile: true, isSauce, isSeleniumStandalone, isIOS, isAndroid
        })
        expect(mobilePrototype instanceof Object).toBe(true)
        expect(typeof mobilePrototype.performActions.value).toBe('function')
        expect(typeof mobilePrototype.sendKeys.value).toBe('function')
        expect(typeof mobilePrototype.lock.value).toBe('function')
        expect(typeof mobilePrototype.getNetworkConnection.value).toBe('function')

        const mobileChromePrototype = getPrototype({
            isW3C: true, isChromium: true, isMobile: true, isSauce, isSeleniumStandalone, isIOS, isAndroid
        })
        expect(mobileChromePrototype instanceof Object).toBe(true)
        expect(typeof mobileChromePrototype.sendCommand.value).toBe('function')
        expect(typeof mobileChromePrototype.performActions.value).toBe('function')
        expect(typeof mobileChromePrototype.sendKeys.value).toBe('function')
        expect(typeof mobileChromePrototype.lock.value).toBe('function')
        expect(typeof mobileChromePrototype.getNetworkConnection.value).toBe('function')

        const saucePrototype = getPrototype({
            isW3C: true, isChromium, isMobile, isSauce: true, isSeleniumStandalone, isIOS, isAndroid
        })
        expect(saucePrototype instanceof Object).toBe(true)
        expect(typeof saucePrototype.getPageLogs.value).toBe('function')
    })

    it('getErrorFromResponseBody', () => {
        const emptyBodyError = new Error('Response has empty body')
        expect(getErrorFromResponseBody('', {})).toEqual(emptyBodyError)
        expect(getErrorFromResponseBody(null, {})).toEqual(emptyBodyError)

        const unknownError = new Error('unknown error')
        expect(getErrorFromResponseBody({}, {})).toEqual(unknownError)

        const nonWebDriverError = new Error('expected')
        const expectedError = new Error('expected')
        expect(getErrorFromResponseBody('expected', {})).toEqual(nonWebDriverError)
        expect(getErrorFromResponseBody({ value: { message: 'expected' } }, {}))
            .toEqual(expectedError)
        expect(getErrorFromResponseBody({ value: { class: 'expected' } }, {}))
            .toEqual(expectedError)

        const ieError = new Error('Command not found: POST /some/command')
        ieError.name = 'unknown method'
        expect(getErrorFromResponseBody({
            message: 'Command not found: POST /some/command',
            error: 'unknown method',
            name: 'Protocol Error'
        }, {})).toEqual(ieError)
    })

    it('CustomRequestError', function () {
        //Firefox
        let error = new CustomRequestError({
            value: {
                error: 'foo',
                message: 'bar'
            }
        }, {})
        expect(error.name).toBe('foo')
        expect(error.message).toBe('bar')

        //Chrome
        error = new CustomRequestError({ value: { message: 'stale element reference' } }, {})
        expect(error.name).toBe('stale element reference')
        expect(error.message).toBe('stale element reference')
        expect(error.stack).toMatch('stale element reference')
        expect(error.stack).toMatch('stale element reference')

        error = new CustomRequestError({ value: { message: 'message' } }, {})
        expect(error.name).toBe('WebDriver Error')
        expect(error.message).toBe('message')
        expect(error.stack).toMatch('WebDriver Error')
        expect(error.stack).toMatch('message')

        error = new CustomRequestError({ value: { class: 'class' } }, {})
        expect(error.name).toBe('WebDriver Error')
        expect(error.message).toBe('class')
        expect(error.stack).toMatch('WebDriver Error')
        expect(error.stack).toMatch('class')

        error = new CustomRequestError({ value: { name: 'Protocol Error' } }, {})
        expect(error.name).toBe('Protocol Error')
        expect(error.message).toBe('unknown error')
        expect(error.stack).toMatch('Protocol Error')
        expect(error.stack).toMatch('unknown error')

        error = new CustomRequestError({ value: { } }, {})
        expect(error.name).toBe('WebDriver Error')
        expect(error.message).toBe('unknown error')
        expect(error.stack).toMatch('WebDriver Error')
        expect(error.stack).toMatch('unknown error')

        error = new CustomRequestError(
            { value: { message: 'invalid locator' } },
            { using: 'css selector', value: '!!' }
        )
        expect(error.message).toMatchSnapshot()
    })

    describe('setupDirectConnect', () => {
        class TestClient implements Client {
            // @ts-expect-error
            sessionId?: string
            // @ts-expect-error
            requestedCapabilities?: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities

            constructor(
                public capabilities: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities,
                public options: Options.WebDriver
            ) {
                this.capabilities = capabilities
                this.options = options
            }
        }

        it('should do nothing if params contain no direct connect caps', function () {
            const client = new TestClient({ platformName: 'baz' }, { hostname: 'bar' } as any) as Client
            setupDirectConnect(client)
            expect(client.options.hostname).toEqual('bar')
        })

        it('should do nothing if params contain incomplete direct connect caps', function () {
            const client = new TestClient({ platformName: 'baz', 'appium:directConnectHost': 'baz' }, { hostname: 'bar' } as any) as Client
            setupDirectConnect(client)
            expect(client.options.hostname).toEqual('bar')
        })

        it('should update connection params if caps contain all direct connect fields', function () {
            const client = new TestClient({
                platformName: 'baz',
                'appium:directConnectProtocol': 'https',
                'appium:directConnectHost': 'bar',
                'appium:directConnectPort': 4321,
                'appium:directConnectPath': '/'
            }, {
                protocol: 'http',
                hostname: 'foo',
                port: 1234,
                path: ''
            } as any) as Client
            setupDirectConnect(client)
            expect(client.options.protocol).toBe('https')
            expect(client.options.hostname).toBe('bar')
            expect(client.options.port).toBe(4321)
            expect(client.options.path).toBe('/')
        })

        it('should update connection params even if path is empty string', function () {
            const client = new TestClient({
                platformName: 'baz',
                'appium:directConnectProtocol': 'https',
                'appium:directConnectHost': 'bar',
                'appium:directConnectPort': 4321,
                'appium:directConnectPath': ''
            }, {
                protocol: 'http',
                hostname: 'foo',
                port: 1234,
                path: ''
            } as any) as Client
            setupDirectConnect(client)
            expect(client.options.protocol).toBe('https')
            expect(client.options.hostname).toBe('bar')
            expect(client.options.port).toBe(4321)
            expect(client.options.path).toBe('')
        })
    })

    describe('getSessionError', () => {
        it('should return unchanged message', () => {
            expect(getSessionError({ message: 'foobar', name: 'Error' }, {})).toEqual('foobar')
        })

        it('should return "more info" if no message', () => {
            expect(getSessionError({ message: '', name: 'Error' }, {})).toEqual('See wdio.* logs for more information.')
        })

        it('should handle not properly set paths', () => {
            expect(getSessionError({ message: 'unhandled request', name: 'Error' }, {}))
                .toContain('Make sure you have set the "path" correctly!')
        })

        it('ECONNREFUSED', () => {
            expect(getSessionError({
                name: 'Some Error',
                code: 'ECONNREFUSED',
                message: 'ECONNREFUSED 127.0.0.1:4444'
            }, {
                protocol: 'https',
                hostname: 'foobar',
                port: 1234,
                path: '/foo/bar'
            })).toContain('Unable to connect to "https://foobar:1234/foo/bar"')
        })

        it('path: selenium-standalone path', () => {
            expect(
                getSessionError(
                    new Error('Whoops! The URL specified routes to this help page.'),
                    {}
                )
            ).toContain("set `path: '/wd/hub'` in")
        })

        it('path: chromedriver, geckodriver, etc', () => {
            expect(getSessionError(new Error('HTTP method not allowed'))).toContain("set `path: '/'` in")
        })

        it('edge driver localhost issue', () => {
            expect(
                getSessionError(new Error('Bad Request - Invalid Hostname 400 <br> HTTP Error 400'))
            ).toContain('127.0.0.1 instead of localhost')
        })

        it('illegal w3c cap passed to selenium standalone', () => {
            const message = getSessionError(
                new Error('Illegal key values seen in w3c capabilities: [chromeOptions]')
            )
            expect(message).toContain('[chromeOptions]')
            expect(message).toContain('add vendor prefix')
        })

        it('wrong host port, port in use, illegal w3c cap passed to grid', () => {
            const message = getSessionError(new Error('Response has empty body'))
            expect(message).toContain('valid hostname:port or the port is not in use')
            expect(message).toContain('add vendor prefix')
        })

        it('should hint for region issues for free-trial users', () => {
            const message = getSessionError(
                new Error('unknown error: failed serving request POST /wd/hub/session: Unauthorized'),
                { hostname: 'https://ondemand.eu-central-1.saucelabs.com' })
            expect(message).toContain('Ensure this region is set in your configuration')
        })
    })

    describe('startWebDriverSession', () => {
        it('attaches capabilities to the params object', async () => {
            const params: Options.WebDriver = {
                hostname: 'localhost',
                port: 4444,
                path: '/',
                protocol: 'http',
                logLevel: 'warn',
                capabilities: {
                    browserName: 'chrome',
                    platform: 'Windows'
                }
            }
            const { sessionId, capabilities } = await startWebDriverSession(params)
            expect(sessionId).toBe('foobar-123')
            expect(capabilities.browserName)
                .toBe('mockBrowser')
        })

        it('should handle sessionRequest error', async () => {
            const error = await startWebDriverSession({
                logLevel: 'warn',
                capabilities: {}
            }).catch((err) => err)
            expect(error.message).toContain('Failed to create session')
        })

        it('should break if JSONWire and WebDriver caps are mixed together', async () => {
            const params: Options.WebDriver = {
                hostname: 'localhost',
                port: 4444,
                path: '/',
                protocol: 'http',
                logLevel: 'warn',
                capabilities: {
                    browserName: 'chrome',
                    'sauce:options': {},
                    platform: 'Windows',
                    // @ts-ignore test invalid cap
                    foo: 'bar'
                }
            }
            const err: Error = await startWebDriverSession(params).catch((err) => err)
            expect(err.message).toContain(
                'Invalid or unsupported WebDriver capabilities found ' +
                '("platform", "foo").'
            )
        })
    })

    describe('getTimeoutError', () => {
        const mkReqOpts = (opts: Options.RequestLibOptions = {}): Options.RequestLibOptions => {
            return {
                url: new URL('https://localhost:4445/default/method'),
                method: 'GET',
                json: {},
                ...opts
            }
        }

        describe('should return error with', () => {
            it('command name as full endpoint', async () => {
                const err = new Error('Timeout')
                const reqOpts = mkReqOpts({ url: new URL('https://localhost:4445/wd/hub/session') })

                const timeoutErr = getTimeoutError(err, reqOpts)

                expect(timeoutErr.message).toEqual(expect.stringMatching('when running "https://localhost:4445/wd/hub/session"'))
            })

            it('command name in shortened form', async () => {
                const err = new Error('Timeout')
                const reqOpts = mkReqOpts({ url: new URL('https://localhost:4445/wd/hub/session/abc123/url') })

                const timeoutErr = getTimeoutError(err, reqOpts)

                expect(timeoutErr.message).toEqual(expect.stringMatching('when running "url"'))
            })

            it('command method', async () => {
                const err = new Error('Timeout')
                const reqOpts = mkReqOpts({ method: 'GET' })

                const timeoutErr = getTimeoutError(err, reqOpts)

                expect(timeoutErr.message).toEqual(expect.stringMatching(/when running .+ with method "GET"/))
            })

            it('command args as stringified object', async () => {
                const err = new Error('Timeout')
                const cmdArgs = { foo: 'bar' }
                const reqOpts = mkReqOpts({ json: cmdArgs })

                const timeoutErr = getTimeoutError(err, reqOpts)

                expect(timeoutErr.message).toEqual(
                    expect.stringMatching(new RegExp(`when running .+ with method .+ and args "${JSON.stringify(cmdArgs)}"`))
                )
            })

            it('command args with base64 script', async () => {
                (transformCommandLogResult as MockedFunction<any>).mockReturnValueOnce('"<Script[base64]>"')

                const err = new Error('Timeout')
                const cmdArgs = { script: Buffer.from('script').toString('base64') }
                const reqOpts = mkReqOpts({ json: cmdArgs })

                const timeoutErr = getTimeoutError(err, reqOpts)

                expect(timeoutErr.message).toEqual(
                    expect.stringMatching(/when running .+ with method .+ and args "<Script\[base64\]>"/)
                )
            })

            it('command args with function script without extra wrapper', async () => {
                const err = new Error('Timeout')
                const cmdArgs = { script: 'return (function() {\nconsole.log("hi")\n}).apply(null, arguments)' }
                const reqOpts = mkReqOpts({ json: cmdArgs })

                const timeoutErr = getTimeoutError(err, reqOpts)

                expect(timeoutErr.message).toEqual(
                    expect.stringMatching(/when running .+ with method .+ and args "function\(\) {\nconsole\.log\("hi"\)\n}/)
                )
            })

            it('command args with base64 screenshot', async () => {
                (transformCommandLogResult as MockedFunction<any>).mockReturnValueOnce('"<Screenshot[base64]>"')

                const err = new Error('Timeout')
                const cmdArgs = { file: Buffer.from('screen').toString('base64') }
                const reqOpts = mkReqOpts({ json: cmdArgs })

                const timeoutErr = getTimeoutError(err, reqOpts)

                expect(timeoutErr.message).toEqual(
                    expect.stringMatching(/when running .+ with method .+ and args "<Screenshot\[base64\]>"/)
                )
            })
        })
    })
})
