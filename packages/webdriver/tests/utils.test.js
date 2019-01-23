import {
    isSuccessfulResponse, isValidParameter, getArgumentType, getPrototype, commandCallStructure,
    environmentDetector, getErrorFromResponseBody, isW3C
} from '../src/utils'

import appiumResponse from './__fixtures__/appium.response.json'
import chromedriverResponse from './__fixtures__/chromedriver.response.json'
import geckodriverResponse from './__fixtures__/geckodriver.response.json'

describe('utils', () => {
    it('isSuccessfulResponse', () => {
        expect(isSuccessfulResponse()).toBe(false)
        expect(isSuccessfulResponse(200)).toBe(false)
        expect(isSuccessfulResponse(200, { value: { some: 'result' } })).toBe(true)
        expect(isSuccessfulResponse(404, { value: { error: new Error('foobar' )} })).toBe(false)
        expect(isSuccessfulResponse(404, { value: { error: 'no such element' } })).toBe(true)
        expect(isSuccessfulResponse(200, { status: 7 })).toBe(false)
        expect(isSuccessfulResponse(undefined, { status: 7, value: {} })).toBe(false)
        expect(isSuccessfulResponse(undefined, { status: 0, value: {} })).toBe(true)
        expect(isSuccessfulResponse(
            undefined,
            { status: 7, value: { message: 'no such element: foobar' } }
        )).toBe(true)
    })

    it('isValidParameter', () => {
        expect(isValidParameter(1, 'number')).toBe(true)
        expect(isValidParameter(1, 'number[]')).toBe(false)
        expect(isValidParameter([1], 'number[]')).toBe(true)
        expect(isValidParameter(null, 'null')).toBe(true)
        expect(isValidParameter('', 'null')).toBe(false)
        expect(isValidParameter(undefined, 'null')).toBe(false)
        expect(isValidParameter({}, 'object')).toBe(true)
        expect(isValidParameter([], 'object')).toBe(true)
        expect(isValidParameter(null, 'object')).toBe(false)
        expect(isValidParameter(1, '(number|string|object)')).toBe(true)
        expect(isValidParameter('1', '(number|string|object)')).toBe(true)
        expect(isValidParameter({}, '(number|string|object)')).toBe(true)
        expect(isValidParameter(false, '(number|string|object)')).toBe(false)
        expect(isValidParameter([], '(number|string|object)')).toBe(true)
        expect(isValidParameter(null, '(number|string|object)')).toBe(false)
        expect(isValidParameter(1, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter('1', '(number|string|object)[]')).toBe(false)
        expect(isValidParameter({}, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter(false, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter([1], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter(['1'], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([{}], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([[]], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([null], '(number|string|object)[]')).toBe(false)
        expect(isValidParameter([false], '(number|string|object)[]')).toBe(false)
        expect(isValidParameter(['1', false], '(number|string|object)[]')).toBe(false)
    })

    it('getArgumentType', () => {
        expect(getArgumentType(1)).toBe('number')
        expect(getArgumentType(1.2)).toBe('number')
        expect(getArgumentType(null)).toBe('null')
        expect(getArgumentType('text')).toBe('string')
        expect(getArgumentType({})).toBe('object')
        expect(getArgumentType([])).toBe('object')
        expect(getArgumentType(true)).toBe('boolean')
        expect(getArgumentType(false)).toBe('boolean')
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

    it('commandCallStructure', () => {
        expect(commandCallStructure('foobar', ['param', 1, true, { a: 123 }, () => true, null, undefined]))
            .toBe('foobar("param", 1, true, <object>, <fn>, null, undefined)')
    })

    describe('environmentDetector', () => {
        const chromeCaps = chromedriverResponse.value
        const appiumCaps = appiumResponse.value.capabilities
        const geckoCaps = geckodriverResponse.value.capabilities

        it('isW3C', () => {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(environmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isW3C).toBe(false)
            expect(environmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isW3C).toBe(true)
            expect(isW3C()).toBe(false)
        })

        it('isChrome', () => {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isChrome).toBe(false)
            expect(environmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isChrome).toBe(true)
            expect(environmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isChrome).toBe(false)
        })

        it('isSauce', () => {
            const capabilities = { browserName: 'chrome' }
            let requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            let hostname = 'ondemand.saucelabs.com'

            expect(environmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(false)

            requestedCapabilities.w3cCaps.alwaysMatch.extendedDebugging = true
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(true)
            requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(false)

            requestedCapabilities.w3cCaps.alwaysMatch['sauce:options'] = { extendedDebugging: true }
            expect(environmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(true)
            expect(environmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)
        })

        it('should not detect mobile app for browserName===undefined', function () {
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const capabilities = {}
            const {isMobile, isIOS, isAndroid} = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should not detect mobile app for browserName==="firefox"', function () {
            const capabilities = { browserName: 'firefox' }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const {isMobile, isIOS, isAndroid} = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should not detect mobile app for browserName==="chrome"', function () {
            const capabilities = { browserName: 'chrome' }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const {isMobile, isIOS, isAndroid} = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(false)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(false)
        })

        it('should detect mobile app for browserName===""', function () {
            const capabilities = { browserName: '' }
            const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
            const {isMobile, isIOS, isAndroid} = environmentDetector({ capabilities, requestedCapabilities })
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
            const {isMobile, isIOS, isAndroid} = environmentDetector({ capabilities, requestedCapabilities })
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
            const {isMobile, isIOS, isAndroid} = environmentDetector({ capabilities, requestedCapabilities })
            expect(isMobile).toEqual(true)
            expect(isIOS).toEqual(false)
            expect(isAndroid).toEqual(true)
        })
    })

    it('getErrorFromResponseBody', () => {
        expect(getErrorFromResponseBody()).toBe(null)
        expect(getErrorFromResponseBody('')).toBe(null)
        expect(getErrorFromResponseBody(null)).toBe(null)

        const unknownError = new Error('unknown error')
        expect(getErrorFromResponseBody({})).toEqual(unknownError)

        const expectedError = new Error('expected')
        expect(getErrorFromResponseBody('expected')).toEqual(expectedError)
        expect(getErrorFromResponseBody({ value: { message: 'expected' } }))
            .toEqual(expectedError)
        expect(getErrorFromResponseBody({ value: { class: 'expected' } }))
            .toEqual(expectedError)
    })
})
