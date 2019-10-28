import {
    isSuccessfulResponse, getPrototype, environmentDetector, setupDirectConnect,
    getErrorFromResponseBody, isW3C, CustomRequestError, getSessionError
} from '../src/utils'

import appiumResponse from './__fixtures__/appium.response.json'
import experitestResponse from './__fixtures__/experitest.response.json'
import chromedriverResponse from './__fixtures__/chromedriver.response.json'
import geckodriverResponse from './__fixtures__/geckodriver.response.json'
import ghostdriverResponse from './__fixtures__/ghostdriver.response.json'
import safaridriverResponse from './__fixtures__/safaridriver.response.json'
import safaridriverLegacyResponse from './__fixtures__/safaridriver.legacy.response.json'
import edgedriverResponse from './__fixtures__/edgedriver.response.json'
import seleniumstandaloneResponse from './__fixtures__/standaloneserver.response.json'

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

    describe('environmentDetector', () => {
        const chromeCaps = chromedriverResponse.value
        const appiumCaps = appiumResponse.value.capabilities
        const experitestAppiumCaps = experitestResponse.appium.capabilities
        const geckoCaps = geckodriverResponse.value.capabilities
        const edgeCaps = edgedriverResponse.value.capabilities
        const phantomCaps = ghostdriverResponse.value
        const safariCaps = safaridriverResponse.value.capabilities
        const safariLegacyCaps = safaridriverLegacyResponse.value
        const standaloneCaps = seleniumstandaloneResponse.value

        it('isMobile', () => {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isMobile).toBe(true)
            expect(environmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isMobile).toBe(true)
            expect(environmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isMobile).toBe(false)
        })

        it('isW3C', () => {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(environmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(environmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(environmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(environmentDetector({ capabilities: safariCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(environmentDetector({ capabilities: edgeCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(environmentDetector({ capabilities: safariLegacyCaps, requestedCapabilities }).isW3C).toBe(false)
            expect(environmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isW3C).toBe(false)
            expect(isW3C()).toBe(false)
        })

        it('isChrome', () => {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isChrome).toBe(false)
            expect(environmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isChrome).toBe(true)
            expect(environmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isChrome).toBe(false)
            expect(environmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isChrome).toBe(false)
        })

        it('isSauce', () => {
            const capabilities = { browserName: 'chrome' }
            let requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            let hostname = 'localhost' // isSauce should also be true if run through Sauce Connect

            expect(environmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(false)

            requestedCapabilities.w3cCaps.alwaysMatch.extendedDebugging = true
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(true)
            requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(false)

            requestedCapabilities.w3cCaps.alwaysMatch['sauce:options'] = { extendedDebugging: true }
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(true)
            expect(environmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(true)
        })

        it('isSeleniumStandalone', () => {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
            expect(environmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
            expect(environmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
            expect(environmentDetector({ capabilities: standaloneCaps, requestedCapabilities }).isSeleniumStandalone).toBe(true)
        })

        it('should not detect mobile app for browserName===undefined', function () {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const capabilities = {}
            const { isMobile, isIOS, isAndroid } = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should not detect mobile app for browserName==="firefox"', function () {
            const capabilities = { browserName: 'firefox' }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const { isMobile, isIOS, isAndroid } = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should not detect mobile app for browserName==="chrome"', function () {
            const capabilities = { browserName: 'chrome' }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const { isMobile, isIOS, isAndroid } = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should detect mobile app for browserName===""', function () {
            const capabilities = { browserName: '' }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const { isMobile, isIOS, isAndroid } = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(true)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should detect Android mobile app', function () {
            const capabilities = {
                platformName: 'Android',
                platformVersion: '4.4',
                deviceName: 'LGVS450PP2a16334',
                app: 'foo.apk'
            }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const { isMobile, isIOS, isAndroid } = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(true)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(true)
        })

        it('should detect Android mobile app without upload', function () {
            const capabilities = {
                platformName: 'Android',
                platformVersion: '4.4',
                deviceName: 'LGVS450PP2a16334',
                appPackage: 'com.example',
                appActivity: 'com.example.gui.LauncherActivity',
                noReset: true,
                appWaitActivity: 'com.example.gui.LauncherActivity'
            }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const { isMobile, isIOS, isAndroid } = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(true)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(true)
        })
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
                    directConnectPath: '/wd/hub'
                }
            }
            setupDirectConnect(params)
            expect(params.protocol).toBe('https')
            expect(params.hostname).toBe('bar')
            expect(params.port).toBe(4321)
            expect(params.path).toBe('/wd/hub')
        })

        it('should update connection params even if path is empty string', function () {
            const params = {
                protocol: 'http',
                hostname: 'foo',
                port: 1234,
                path: '/wd/hub',
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
            expect(getSessionError({ message: 'foobar' })).toEqual('foobar')
        })

        it('should return "more info" if no message', () => {
            expect(getSessionError({})).toEqual('See logs for more information.')
        })

        it('ECONNREFUSED', () => {
            expect(getSessionError({
                code: 'ECONNREFUSED',
                address: '127.0.0.1',
                port: 4444,
                message: 'ECONNREFUSED 127.0.0.1:4444'
            })).toContain('Unable to connect to "127.0.0.1:4444"')
        })

        it('path: selenium-standalone path', () => {
            expect(getSessionError({
                message: 'Whoops! The URL specified routes to this help page.'
            })).toContain('no `path` in wdio.conf')
        })

        it('path: chromedriver, geckodriver, etc', () => {
            expect(getSessionError({
                message: 'HTTP method not allowed'
            })).toContain("`path: '/'` exists")
        })

        it('path: chromedriver, geckodriver, etc', () => {
            expect(getSessionError({
                message: 'Bad Request - Invalid Hostname 400 <br> HTTP Error 400'
            })).toContain('127.0.0.1 instead of localhost')
        })
    })
})
