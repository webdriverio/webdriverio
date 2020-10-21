import { sessionEnvironmentDetector, capabilitiesEnvironmentDetector } from '../src/envDetector'

import appiumResponse from './__fixtures__/appium.response.json'
import experitestResponse from './__fixtures__/experitest.response.json'
import chromedriverResponse from './__fixtures__/chromedriver.response.json'
import geckodriverResponse from './__fixtures__/geckodriver.response.json'
import ghostdriverResponse from './__fixtures__/ghostdriver.response.json'
import safaridriverResponse from './__fixtures__/safaridriver.response.json'
import safaridriverLegacyResponse from './__fixtures__/safaridriver.legacy.response.json'
import edgedriverResponse from './__fixtures__/edgedriver.response.json'
import seleniumstandaloneResponse from './__fixtures__/standaloneserver.response.json'

describe('sessionEnvironmentDetector', () => {
    const chromeCaps = chromedriverResponse.value as WebDriver.Capabilities
    const appiumCaps = appiumResponse.value.capabilities as WebDriver.Capabilities
    const experitestAppiumCaps = experitestResponse.appium.capabilities as WebDriver.Capabilities
    const geckoCaps = geckodriverResponse.value.capabilities as WebDriver.Capabilities
    const edgeCaps = edgedriverResponse.value.capabilities as WebDriver.Capabilities
    const phantomCaps = ghostdriverResponse.value as WebDriver.Capabilities
    const safariCaps = safaridriverResponse.value.capabilities as WebDriver.Capabilities
    const safariLegacyCaps = safaridriverLegacyResponse.value as WebDriver.Capabilities
    const standaloneCaps = seleniumstandaloneResponse.value as WebDriver.DesiredCapabilities

    it('isMobile', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({}).isMobile).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isMobile).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isMobile).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isMobile).toBe(false)
    })

    it('isW3C', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({}).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: edgeCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariLegacyCaps, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities }).isW3C).toBe(false)
    })

    it('isChrome', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({}).isChrome).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isChrome).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isChrome).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isChrome).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isChrome).toBe(false)
    })

    it('isSauce', () => {
        const capabilities = { browserName: 'chrome' }
        let requestedCapabilities: WebDriver.DesiredCapabilities = {}

        expect(sessionEnvironmentDetector({}).isSauce).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)

        requestedCapabilities.extendedDebugging = true
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(true)
        requestedCapabilities = {}
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)

        requestedCapabilities['sauce:options'] = { extendedDebugging: true }
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(true)
    })

    it('isSauce (w3c)', () => {
        const capabilities = { browserName: 'chrome' }
        let requestedCapabilities: WebDriver.W3CCapabilities = {
            alwaysMatch: {},
            firstMatch: []
        }

        expect(sessionEnvironmentDetector({}).isSauce).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)

        requestedCapabilities.alwaysMatch = { 'sauce:options': { extendedDebugging: true } }
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(true)
        requestedCapabilities.alwaysMatch = { 'sauce:options': {} }
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)
    })

    it('isSeleniumStandalone', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({}).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: standaloneCaps, requestedCapabilities }).isSeleniumStandalone).toBe(true)
    })

    it('should not detect mobile app for browserName===undefined', function () {
        const requestedCapabilities = { browserName: '' }
        const capabilities = {}
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(false)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should not detect mobile app for browserName==="firefox"', function () {
        const capabilities = { browserName: 'firefox' }
        const requestedCapabilities = { browserName: '' }
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(false)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should not detect mobile app for browserName==="chrome"', function () {
        const capabilities = { browserName: 'chrome' }
        const requestedCapabilities = { browserName: '' }
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(false)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should detect mobile app for browserName===""', function () {
        const capabilities = { browserName: '' }
        const requestedCapabilities = { browserName: '' }
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
        const requestedCapabilities = { browserName: '' }
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
        const requestedCapabilities = { browserName: '' }
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(true)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(true)
    })
})

describe('capabilitiesEnvironmentDetector', () => {
    it('should return env flags without isW3C and isSeleniumStandalone', () => {
        const sessionFlags = sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: { browserName: '' } })
        const capabilitiesFlags = capabilitiesEnvironmentDetector({}, 'webdriver')

        const expectedFlags = Object.keys(sessionFlags).filter(flagName => !['isW3C', 'isSeleniumStandalone'].includes(flagName))
        expect(Object.keys(capabilitiesFlags)).toEqual(expectedFlags)
    })

    it('should return devtools env flags if automationProtocol is devtools', () => {
        const capabilitiesFlags = capabilitiesEnvironmentDetector({}, 'devtools')

        expect((capabilitiesFlags as any).isDevTools).toBe(true)
        expect((capabilitiesFlags as any).isSeleniumStandalone).toBe(false)
        expect(capabilitiesFlags.isChrome).toBe(false)
        expect(capabilitiesFlags.isMobile).toBe(false)
    })
})
