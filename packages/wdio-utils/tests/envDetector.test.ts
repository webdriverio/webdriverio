import { describe, it, expect } from 'vitest'
import type { Capabilities } from '@wdio/types'

import { sessionEnvironmentDetector, capabilitiesEnvironmentDetector } from '../src/envDetector.js'

import appiumResponse from './__fixtures__/appium.response.json' assert { type: 'json' }
import experitestResponse from './__fixtures__/experitest.response.json' assert { type: 'json' }
import chromedriverResponse from './__fixtures__/chromedriver.response.json' assert { type: 'json' }
import geckodriverResponse from './__fixtures__/geckodriver.response.json' assert { type: 'json' }
import ghostdriverResponse from './__fixtures__/ghostdriver.response.json' assert { type: 'json' }
import safaridriverResponse from './__fixtures__/safaridriver.response.json' assert { type: 'json' }
import safaridriverdockerNpNResponse from './__fixtures__/safaridriverdockerNpN.response.json' assert { type: 'json' }
import safaridriverdockerNbVResponse from './__fixtures__/safaridriverdockerNbV.response.json' assert { type: 'json' }
import safaridriverLegacyResponse from './__fixtures__/safaridriver.legacy.response.json' assert { type: 'json' }
import edgedriverResponse from './__fixtures__/edgedriver.response.json' assert { type: 'json' }
import seleniumstandaloneResponse from './__fixtures__/standaloneserver.response.json' assert { type: 'json' }
import seleniumstandalone4Response from './__fixtures__/standaloneserver4.response.json' assert { type: 'json' }
import bidiResponse from './__fixtures__/bidi.response.json' assert { type: 'json' }

describe('sessionEnvironmentDetector', () => {
    const chromeCaps = chromedriverResponse.value as WebdriverIO.Capabilities
    const appiumCaps = appiumResponse.value.capabilities as WebdriverIO.Capabilities
    const experitestAppiumCaps = experitestResponse.appium.capabilities as WebdriverIO.Capabilities
    const geckoCaps = geckodriverResponse.value.capabilities as WebdriverIO.Capabilities
    const edgeCaps = edgedriverResponse.value.capabilities as WebdriverIO.Capabilities
    const phantomCaps = ghostdriverResponse.value as WebdriverIO.Capabilities
    const safariCaps = safaridriverResponse.value.capabilities as WebdriverIO.Capabilities
    const safariDockerNpNCaps = safaridriverdockerNpNResponse.value.capabilities as WebdriverIO.Capabilities // absent capability.platformName
    const safariDockerNbVCaps = safaridriverdockerNbVResponse.value.capabilities as WebdriverIO.Capabilities // absent capability.browserVersion
    const safariLegacyCaps = safaridriverLegacyResponse.value as WebdriverIO.Capabilities
    const standaloneCaps = seleniumstandaloneResponse.value as Capabilities.DesiredCapabilities
    const standalonev4Caps = seleniumstandalone4Response.value as Capabilities.DesiredCapabilities

    it('isMobile', () => {
        const requestedCapabilities = { browserName: '' }
        const appiumReqCaps = { 'appium:options': {} }
        const appiumW3CCaps = { alwaysMatch: { 'appium:options': {} }, firstMatch: [] }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isMobile).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isMobile).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isMobile).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isMobile).toBe(false)
        // doesn't matter if there are Appium capabilities if returned session details don't show signs of Appium
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities: appiumReqCaps }).isMobile).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities: appiumW3CCaps }).isMobile).toBe(false)

        // expected to be false since it has apppium: but no mobile related platform name info
        const newCaps = { ...chromeCaps, 'appium:options': {} }
        expect(sessionEnvironmentDetector({ capabilities: newCaps, requestedCapabilities }).isMobile).toBe(false)

        // match with Appium if it had
        const iosCaps = { ...chromeCaps, 'platformName': 'ios' }
        expect(sessionEnvironmentDetector({ capabilities: iosCaps, requestedCapabilities }).isMobile).toBe(true)
        const tvOSCaps = { ...chromeCaps, 'platformName': 'tvOS' }
        expect(sessionEnvironmentDetector({ capabilities: tvOSCaps, requestedCapabilities }).isMobile).toBe(true)
        const androidCaps = { ...chromeCaps, 'platformName': 'Android' }
        expect(sessionEnvironmentDetector({ capabilities: androidCaps, requestedCapabilities }).isMobile).toBe(true)
        const iosCapsBS = { 'bstack:options': { ...chromeCaps, 'platformName': 'ios' } }
        expect(sessionEnvironmentDetector({ capabilities: iosCapsBS, requestedCapabilities }).isMobile).toBe(true)
        const tvOSCapsBS = { 'bstack:options': { ...chromeCaps, 'platformName': 'tvOS' } }
        expect(sessionEnvironmentDetector({ capabilities: tvOSCapsBS, requestedCapabilities }).isMobile).toBe(true)
        const androidCapsBS = { 'bstack:options': { ...chromeCaps, 'platformName': 'Android' } }
        expect(sessionEnvironmentDetector({ capabilities: androidCapsBS, requestedCapabilities }).isMobile).toBe(true)
    })

    it('isW3C', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariDockerNbVCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariDockerNpNCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: edgeCaps, requestedCapabilities }).isW3C).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: safariLegacyCaps, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: {
            maxInstances: 7,
            platformName: 'WINDOWS',
            'appium:app': 'C:\\Program Files\\App.exe',
            'appium:appArguments': '-noCloseConfirmationPopUp -shouldDisplayDiesToTake',
            'ms:experimental-webdriver': true,
            'ms:waitForAppLaunch': '10',
        }, requestedCapabilities }).isW3C).toBe(true)
    })

    it('isChrome', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isChrome).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isChrome).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isChrome).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isChrome).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isChrome).toBe(false)
    })

    it('isChromium', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isChromium).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isChromium).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isChromium).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: edgeCaps, requestedCapabilities }).isChromium).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isChromium).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isChromium).toBe(false)
    })

    it('isFirefox', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isFirefox).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isFirefox).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isFirefox).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isFirefox).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isFirefox).toBe(false)
    })

    it('isBidi', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: bidiResponse, requestedCapabilities }).isBidi).toBe(true)
    })

    it('isSauce', () => {
        const capabilities = { browserName: 'chrome' }
        let requestedCapabilities: WebDriver.DesiredCapabilities = {}

        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isSauce).toBe(false)
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
        const requestedCapabilities: Capabilities.W3CCapabilities = {
            alwaysMatch: {},
            firstMatch: []
        }

        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isSauce).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)

        requestedCapabilities.alwaysMatch = { 'sauce:options': { extendedDebugging: true } }
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(true)
        requestedCapabilities.alwaysMatch = { 'sauce:options': {} }
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)
    })

    it('isSeleniumStandalone', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isSeleniumStandalone).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: standaloneCaps, requestedCapabilities }).isSeleniumStandalone).toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: standalonev4Caps, requestedCapabilities }).isSeleniumStandalone).toBe(true)
    })

    it('should not detect mobile app for browserName===undefined', function () {
        const requestedCapabilities = { browserName: '' }
        const capabilities = {}
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(false)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should not detect mobile app for browserName===undefined with BrowserStack Service', function () {
        const requestedCapabilities = { browserName: '' }
        const capabilities = { 'bstack:options': {} }
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

    it('should not detect mobile app for browserName==="firefox" with BrowserStack Service', function () {
        const capabilities = { 'bstack:options': { browserName: 'firefox' } }
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

    it('should not detect mobile app for browserName==="chrome" with BrowserStack Service', function () {
        const capabilities = { 'bstack:options': { browserName: 'chrome' } }
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

    it('should detect mobile app for browserName==="" with BrowserStack Service', function () {
        const capabilities =  { 'bstack:options': { browserName: '' } }
        const requestedCapabilities = { browserName: '' }
        const { isMobile, isIOS, isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(true)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
    })

    it('should detect a Windows application automated through Appium', () => {
        const capabilities: any = {
            platformName: 'WINDOWS',
            'ms:experimental-webdriver': true,
            'ms:waitForAppLaunch': 10,
            app: 'C:\\Program Files\\foo\\bar.exe',
            appArguments: '-noCloseConfirmationPopUp -shouldDisplayDiesToTake'
        }
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

    it('should detect Android mobile app without upload with BrowserStack Service', function () {
        const capabilities = {
            'bstack:options':
            {
                platformName: 'Android',
                platformVersion: '4.4',
                deviceName: 'LGVS450PP2a16334',
                appPackage: 'com.example',
                appActivity: 'com.example.gui.LauncherActivity',
                noReset: true,
                appWaitActivity: 'com.example.gui.LauncherActivity'
            }
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
