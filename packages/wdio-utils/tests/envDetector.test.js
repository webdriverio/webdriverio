import { sessionEnvironmentDetector, capabilitiesEnvironmentDetector } from '../src/envDetector'

import appiumResponse from './__fixtures__/appium.response.json'
import experitestResponse from './__fixtures__/experitest.response.json'
import chromedriverResponse from './__fixtures__/chromedriver.response.json'
import geckodriverResponse from './__fixtures__/geckodriver.response.json'
import ghostdriverResponse from './__fixtures__/ghostdriver.response.json'
import safaridriverResponse from './__fixtures__/safaridriver.response.json'
import safaridriverLegacyResponse from './__fixtures__/safaridriver.legacy.response.json'
import edgedriverResponse from './__fixtures__/edgedriver.response.json'
import edgeChromiumResponse from './__fixtures__/edgeChromium.response.json'
import seleniumstandaloneResponse from './__fixtures__/standaloneserver.response.json'

describe('sessionEnvironmentDetector', () => {
    const chromeCaps = chromedriverResponse.value
    const appiumCaps = appiumResponse.value.capabilities
    const experitestAppiumCaps = experitestResponse.appium.capabilities
    const geckoCaps = geckodriverResponse.value.capabilities
    const edgeCaps = edgedriverResponse.value.capabilities
    const edgeChromiumCaps = edgeChromiumResponse.value
    const phantomCaps = ghostdriverResponse.value
    const safariCaps = safaridriverResponse.value.capabilities
    const safariLegacyCaps = safaridriverLegacyResponse.value
    const standaloneCaps = seleniumstandaloneResponse.value

    it('isMobile', () => {
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        expect(sessionEnvironmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isMobile).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isMobile).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isMobile).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: edgeChromiumCaps, requestedCapabilities }).isMobile).toBe(false)
    })

    it('isW3C', () => {
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: edgeCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: edgeChromiumCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariLegacyCaps, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ requestedCapabilities }).isW3C).toBe(false)
    })

    it('isChromium', () => {
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isChromium).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isChromium).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: edgeChromiumCaps, requestedCapabilities }).isChromium).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isChromium).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isChromium).toBe(false)
    })

    it('isSauce', () => {
        const capabilities = { browserName: 'chrome' }
        let requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        let hostname = 'localhost' // isSauce should also be true if run through Sauce Connect

        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(false)

        requestedCapabilities.w3cCaps.alwaysMatch.extendedDebugging = true
        expect(sessionEnvironmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(true)
        requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        expect(sessionEnvironmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(false)

        requestedCapabilities.w3cCaps.alwaysMatch['sauce:options'] = { extendedDebugging: true }
        expect(sessionEnvironmentDetector({ capabilities, hostname, requestedCapabilities }).isSauce).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(true)
    })

    it('isSeleniumStandalone', () => {
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: standaloneCaps, requestedCapabilities }).isSeleniumStandalone).toBe(true)
    })

    it('should not detect mobile app for browserName===undefined', function () {
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        const capabilities = {}
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(false)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should not detect mobile app for browserName==="firefox"', function () {
        const capabilities = { browserName: 'firefox' }
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(false)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should not detect mobile app for browserName==="chrome"', function () {
        const capabilities = { browserName: 'chrome' }
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(false)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should detect mobile app for browserName===""', function () {
        const capabilities = { browserName: '' }
        const requestedCapabilities = { w3cCaps: { alwaysMatch: {} } }
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
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
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
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
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(true)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(true)
    })
})

describe('capabilitiesEnvironmentDetector', () => {
    it('should return env flags without isW3C and isSeleniumStandalone', () => {
        const sessionFlags = sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: { w3cCaps: { alwaysMatch : {} } } })
        const capabilitiesFlags = capabilitiesEnvironmentDetector({})

        const expectedFlags = Object.keys(sessionFlags).filter(flagName => !['isW3C', 'isSeleniumStandalone'].includes(flagName))
        expect(Object.keys(capabilitiesFlags)).toEqual(expectedFlags)
    })

    it('should return devtools env flags if automationProtocol is devtools', () => {
        const capabilitiesFlags = capabilitiesEnvironmentDetector({}, 'devtools')

        expect(capabilitiesFlags.isDevTools).toBe(true)
        expect(capabilitiesFlags.isSeleniumStandalone).toBe(false)
        expect(capabilitiesFlags.isChromium).toBe(false)
        expect(capabilitiesFlags.isMobile).toBe(false)
    })
    it('should be detect chromium browser if browser is chrome and automationProtocol is devtools', () => {
        const capabilitiesFlags = capabilitiesEnvironmentDetector(chromedriverResponse.value, 'devtools')
        expect(capabilitiesFlags.isChromium).toBe(true)
    })
    it('should be detect chromium browser if browser is edge and automationProtocol is devtools', () => {
        const capabilitiesFlags = capabilitiesEnvironmentDetector(edgeChromiumResponse.value, 'devtools')
        expect(capabilitiesFlags.isChromium).toBe(true)
    })
})
