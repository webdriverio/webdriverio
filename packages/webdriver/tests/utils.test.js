import {
    isSuccessfulResponse, getPrototype, setupDirectConnect, getSessionError,
    getErrorFromResponseBody, CustomRequestError, startWebDriverSession
} from '../src/utils'

describe('utils', () => {
    it('isSuccessfulResponse', () => {
        expect(isSuccessfulResponse()).toBe(false)
        expect(isSuccessfulResponse(200)).toBe(false)
        expect(isSuccessfulResponse(200, { value: { some: 'result' } })).toBe(true)
        expect(isSuccessfulResponse(404, { value: { error: new Error('foobar' ) } })).toBe(false)
        expect(isSuccessfulResponse(404, { value: { error: 'no such element' } })).toBe(true)
        expect(isSuccessfulResponse(404, { value: {
            message: 'An element could not be located on the page using the given search parameters.' }
        })).toBe(true)
        expect(isSuccessfulResponse(200, { status: 7 })).toBe(false)
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
        const jsonWireProtocolPrototype = getPrototype({})
        expect(jsonWireProtocolPrototype instanceof Object).toBe(true)
        expect(typeof jsonWireProtocolPrototype.sendKeys.value).toBe('function')
        expect(typeof jsonWireProtocolPrototype.sendCommand).toBe('undefined')
        expect(typeof jsonWireProtocolPrototype.lock).toBe('undefined')

        const webdriverPrototype = getPrototype({ isW3C: true })
        expect(webdriverPrototype instanceof Object).toBe(true)
        expect(typeof webdriverPrototype.sendKeys).toBe('undefined')
        expect(typeof webdriverPrototype.sendCommand).toBe('undefined')
        expect(typeof webdriverPrototype.performActions.value).toBe('function')
        expect(typeof webdriverPrototype.lock).toBe('undefined')

        const chromiumPrototype = getPrototype({ isW3C: false, isChrome: true })
        expect(chromiumPrototype instanceof Object).toBe(true)
        expect(typeof chromiumPrototype.sendCommand.value).toBe('function')
        expect(typeof chromiumPrototype.getElementValue.value).toBe('function')
        expect(typeof chromiumPrototype.elementSendKeys.value).toBe('function')
        expect(typeof chromiumPrototype.lock).toBe('undefined')

        const mobilePrototype = getPrototype({ isW3C: true, isChrome: false, isMobile: true })
        expect(mobilePrototype instanceof Object).toBe(true)
        expect(typeof mobilePrototype.performActions.value).toBe('function')
        expect(typeof mobilePrototype.sendKeys.value).toBe('function')
        expect(typeof mobilePrototype.lock.value).toBe('function')
        expect(typeof mobilePrototype.getNetworkConnection.value).toBe('function')

        const mobileChromePrototype = getPrototype({ isW3C: true, isChrome: true, isMobile: true })
        expect(mobileChromePrototype instanceof Object).toBe(true)
        expect(typeof mobileChromePrototype.sendCommand.value).toBe('function')
        expect(typeof mobileChromePrototype.performActions.value).toBe('function')
        expect(typeof mobileChromePrototype.sendKeys.value).toBe('function')
        expect(typeof mobileChromePrototype.lock.value).toBe('function')
        expect(typeof mobileChromePrototype.getNetworkConnection.value).toBe('function')

        const saucePrototype = getPrototype({ isW3C: true, isSauce: true })
        expect(saucePrototype instanceof Object).toBe(true)
        expect(typeof saucePrototype.getPageLogs.value).toBe('function')
    })

    it('getErrorFromResponseBody', () => {
        const emptyBodyError = new Error('Response has empty body')
        expect(getErrorFromResponseBody()).toEqual(emptyBodyError)
        expect(getErrorFromResponseBody('')).toEqual(emptyBodyError)
        expect(getErrorFromResponseBody(null)).toEqual(emptyBodyError)

        const unknownError = new Error('unknown error')
        expect(getErrorFromResponseBody({})).toEqual(unknownError)

        const expectedError = new Error('expected')
        expect(getErrorFromResponseBody('expected')).toEqual(expectedError)
        expect(getErrorFromResponseBody({ value: { message: 'expected' } }))
            .toEqual(expectedError)
        expect(getErrorFromResponseBody({ value: { class: 'expected' } }))
            .toEqual(expectedError)

        const ieError = new Error('Command not found: POST /some/command')
        ieError.name = 'unknown method'
        expect(getErrorFromResponseBody({
            message: 'Command not found: POST /some/command',
            error: 'unknown method'
        })).toEqual(ieError)
    })

    it('CustomRequestError', function () {
        //Firefox
        let error = new CustomRequestError({
            value: {
                error: 'foo',
                message: 'bar'
            }
        })
        expect(error.name).toBe('foo')
        expect(error.message).toBe('bar')

        //Chrome
        error = new CustomRequestError({ value: { message: 'stale element reference' } })
        expect(error.name).toBe('stale element reference')
        expect(error.message).toBe('stale element reference')

        error = new CustomRequestError({ value: { message: 'message' } } )
        expect(error.name).toBe('Error')
        expect(error.message).toBe('message')

        error = new CustomRequestError({ value: { class: 'class' } } )
        expect(error.name).toBe('Error')
        expect(error.message).toBe('class')

        error = new CustomRequestError({ value: { } } )
        expect(error.name).toBe('Error')
        expect(error.message).toBe('unknown error')
    })

    describe('setupDirectConnect', () => {
        it('should do nothing if params contain no direct connect caps', function () {
            const params = { hostname: 'bar', capabilities: { platformName: 'baz' } }
            const paramsCopy = JSON.parse(JSON.stringify(params))
            setupDirectConnect(params)
            expect(params).toEqual(paramsCopy)
        })

        it('should do nothing if params contain incomplete direct connect caps', function () {
            const params = { hostname: 'bar', capabilities: { directConnectHost: 'baz' } }
            const paramsCopy = JSON.parse(JSON.stringify(params))
            setupDirectConnect(params)
            expect(params).toEqual(paramsCopy)
        })

        it('should update connection params if caps contain all direct connect fields', function () {
            const params = {
                protocol: 'http',
                hostname: 'foo',
                port: 1234,
                path: '',
                capabilities: {
                    directConnectProtocol: 'https',
                    directConnectHost: 'bar',
                    directConnectPort: 4321,
                    directConnectPath: '/'
                }
            }
            setupDirectConnect(params)
            expect(params.protocol).toBe('https')
            expect(params.hostname).toBe('bar')
            expect(params.port).toBe(4321)
            expect(params.path).toBe('/')
        })

        it('should update connection params even if path is empty string', function () {
            const params = {
                protocol: 'http',
                hostname: 'foo',
                port: 1234,
                path: '/',
                capabilities: {
                    directConnectProtocol: 'https',
                    directConnectHost: 'bar',
                    directConnectPort: 4321,
                    directConnectPath: ''
                }
            }
            setupDirectConnect(params)
            expect(params.protocol).toBe('https')
            expect(params.hostname).toBe('bar')
            expect(params.port).toBe(4321)
            expect(params.path).toBe('')
        })
    })

    describe('getSessionError', () => {
        it('should return unchanged message', () => {
            expect(getSessionError({ message: 'foobar' }, {})).toEqual('foobar')
        })

        it('should return "more info" if no message', () => {
            expect(getSessionError({}, {})).toEqual('See wdio.* logs for more information.')
        })

        it('should handle not properly set paths', () => {
            expect(getSessionError({ message: 'unhandled request' }, {}))
                .toContain('Make sure you have set the "path" correctly!')
        })

        it('ECONNREFUSED', () => {
            expect(getSessionError({
                code: 'ECONNREFUSED',
                address: '127.0.0.1',
                port: 4444,
                message: 'ECONNREFUSED 127.0.0.1:4444'
            }, {
                protocol: 'https',
                hostname: 'foobar',
                port: 1234,
                path: '/foo/bar'
            })).toContain('Unable to connect to "https://foobar:1234/foo/bar"')
        })

        it('path: selenium-standalone path', () => {
            expect(getSessionError({
                message: 'Whoops! The URL specified routes to this help page.'
            }, {})).toContain("set `path: '/wd/hub'` in")
        })

        it('path: chromedriver, geckodriver, etc', () => {
            expect(getSessionError({
                message: 'HTTP method not allowed'
            })).toContain("set `path: '/'` in")
        })

        it('edge driver localhost issue', () => {
            expect(getSessionError({
                message: 'Bad Request - Invalid Hostname 400 <br> HTTP Error 400'
            }, {})).toContain('127.0.0.1 instead of localhost')
        })

        it('illegal w3c cap passed to selenium standalone', () => {
            const message = getSessionError({
                message: 'Illegal key values seen in w3c capabilities: [chromeOptions]'
            }, {})
            expect(message).toContain('[chromeOptions]')
            expect(message).toContain('add vendor prefix')
        })

        it('wrong host port, port in use, illegal w3c cap passed to grid', () => {
            const message = getSessionError({
                message: 'Response has empty body'
            })
            expect(message).toContain('valid hostname:port or the port is not in use')
            expect(message).toContain('add vendor prefix')
        })
    })

    describe('startWebDriverSession', () => {
        it('attaches capabilities to the params object', async () => {
            const params = {
                hostname: 'localhost',
                port: 4444,
                path: '/',
                protocol: 'http',
                capabilities: {
                    browserName: 'chrome',
                }
            }
            const sessionId = await startWebDriverSession(params)
            expect(sessionId).toBe('foobar-123')
            expect(params.capabilities.browserName).toBe('mockBrowser')
            expect(params.requestedCapabilities.browserName).toBe('chrome')

        })

        it('should handle sessionRequest error', async () => {
            let error = await startWebDriverSession({}).catch((err) => err)
            expect(error.message).toContain('Failed to create session')
        })
    })
})
