import { describe, it, expect } from 'vitest'
import type { Capabilities } from '@wdio/types'

import { sessionEnvironmentDetector, capabilitiesEnvironmentDetector } from '../src/envDetector.js'

import appiumResponse from './__fixtures__/appium.response.json' with { type: 'json' }
import experitestResponse from './__fixtures__/experitest.response.json' with { type: 'json' }
import chromedriverResponse from './__fixtures__/chromedriver.response.json' with { type: 'json' }
import geckodriverResponse from './__fixtures__/geckodriver.response.json' with { type: 'json' }
import ghostdriverResponse from './__fixtures__/ghostdriver.response.json' with { type: 'json' }
import safaridriverResponse from './__fixtures__/safaridriver.response.json' with { type: 'json' }
import safaridriverdockerNpNResponse from './__fixtures__/safaridriverdockerNpN.response.json' with { type: 'json' }
import safaridriverdockerNbVResponse from './__fixtures__/safaridriverdockerNbV.response.json' with { type: 'json' }
import safaridriverLegacyResponse from './__fixtures__/safaridriver.legacy.response.json' with { type: 'json' }
import edgedriverResponse from './__fixtures__/edgedriver.response.json' with { type: 'json' }
import seleniumstandaloneResponse from './__fixtures__/standaloneserver.response.json' with { type: 'json' }
import seleniumstandalone4Response from './__fixtures__/standaloneserver4.response.json' with { type: 'json' }
import bidiResponse from './__fixtures__/bidi.response.json' with { type: 'json' }

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
    const standaloneCaps = seleniumstandaloneResponse.value as WebdriverIO.Capabilities
    const standalonev4Caps = seleniumstandalone4Response.value as WebdriverIO.Capabilities

    it('isMobile', () => {
        const requestedCapabilities = { browserName: '' }
        const appiumReqCaps: Capabilities.RequestedStandaloneCapabilities = { 'appium:platformName': 'foo' }
        const appiumW3CCaps: Capabilities.RequestedStandaloneCapabilities = { alwaysMatch: { 'appium:platformName': 'foo' }, firstMatch: [] }
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

        const geckoAppiumCaps = { 'appium:automationName': 'Gecko' }
        expect(sessionEnvironmentDetector({ capabilities: geckoAppiumCaps, requestedCapabilities }).isMobile).toBe(false)
        const safariAppiumCaps = { 'appium:options': { automationName: 'safari' } }
        expect(sessionEnvironmentDetector({ capabilities: safariAppiumCaps, requestedCapabilities }).isMobile).toBe(false)
        const chromiumAppiumCaps = { 'appium:automationName': 'chrome' }
        expect(sessionEnvironmentDetector({ capabilities: chromiumAppiumCaps, requestedCapabilities }).isMobile).toBe(false)
    })

    it('isW3C', () => {
        const requestedCapabilities = { browserName: '' }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isW3C).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: experitestAppiumCaps, requestedCapabilities }).isW3C).toBe(false)
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
            'wdio:maxInstances': 7,
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
        const chromeHeadlessShellCaps = { ...chromeCaps, 'browserName': 'chrome-headless-shell' }
        expect(sessionEnvironmentDetector({ capabilities: chromeHeadlessShellCaps, requestedCapabilities }).isChrome).toBe(true)
    })

    it('isWindowsApp', () => {
        const requestedCapabilities = { browserName: '' }
        const capabilities: WebdriverIO.Capabilities = {
            platformName: 'windows',
            'appium:automationName': 'windows',
            'appium:deviceName': 'WindowsPC',
        }
        const {
            isMobile,
            isWindowsApp,
            isMacApp,
            isAndroid,
            isIOS
        } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })

        expect(isMobile).toEqual(true)
        expect(isWindowsApp).toEqual(true)
        expect(isMacApp).toEqual(false)
        expect(isAndroid).toEqual(false)
        expect(isIOS).toEqual(false)
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
        const requestedAppiumCapabilities = {
            browserName: 'chrome',
            platformName: 'windows',
            'appium:automationName': 'Chromium',
            'goog:chromeOptions': {
                args: ['user-data-dir=C:/Users/me/AppData/Local/Google/Chrome/User Data'],
            }
        }
        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: appiumCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: chromeCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: geckoCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: phantomCaps, requestedCapabilities }).isBidi).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities: bidiResponse as unknown as WebdriverIO.Capabilities, requestedCapabilities }).isBidi)
            .toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: bidiResponse as unknown as WebdriverIO.Capabilities, requestedCapabilities: requestedAppiumCapabilities }).isBidi)
            .toBe(true)
        expect(sessionEnvironmentDetector({ capabilities: {
            webSocketUrl: true
        }, requestedCapabilities: {} }).isBidi).toBe(false)
    })

    it('isSauce', () => {
        const capabilities = { browserName: 'chrome' }
        let requestedCapabilities: WebdriverIO.Capabilities = {}

        expect(sessionEnvironmentDetector({ capabilities: {}, requestedCapabilities: {} }).isSauce).toBe(false)
        expect(sessionEnvironmentDetector({ capabilities, requestedCapabilities }).isSauce).toBe(false)

        requestedCapabilities['sauce:options'] = { extendedDebugging: true }
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

    describe('isAndroid', () => {
        it('should detect Android device', () => {
            const capabilities: WebdriverIO.Capabilities = {
                'bstack:options': {
                    osVersion: '15.0',
                    deviceName: 'Samsung Galaxy S25',
                    realMobile: true,
                    appiumVersion: '2.4.1',
                    projectName: 'ProjectName',
                    buildName: 'BuildName + ' + new Date().toISOString(),
                    sessionName: 'SessionName',
                    seleniumVersion: '4.20.0',
                    debug: true,
                    networkLogs: true,
                    consoleLogs: 'verbose',
                },
                browserName: 'chrome',
            }
            const requestedCapabilities = { browserName: 'chrome' }
            const { isAndroid } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
            expect(isAndroid).toEqual(true)
        })

        it('should detect Android by device name in bstack:options using sessionEnvironmentDetector', () => {
            expect(sessionEnvironmentDetector({
                capabilities: { 'bstack:options': { deviceName: 'Samsung Galaxy S21' } },
                requestedCapabilities: {}
            }).isAndroid).toBe(true)

            expect(sessionEnvironmentDetector({
                capabilities: { 'bstack:options': { deviceName: 'Google Pixel 7' } },
                requestedCapabilities: {}
            }).isAndroid).toBe(true)

            expect(sessionEnvironmentDetector({
                capabilities: { 'bstack:options': { deviceName: 'OnePlus 9 Pro' } },
                requestedCapabilities: {}
            }).isAndroid).toBe(true)

            expect(sessionEnvironmentDetector({
                capabilities: { 'bstack:options': { deviceName: 'Nexus 5X' } },
                requestedCapabilities: {}
            }).isAndroid).toBe(true)
        })

        it('should detect Android by device name in bstack:options using capabilitiesEnvironmentDetector', () => {
            expect(capabilitiesEnvironmentDetector({
                'bstack:options': { deviceName: 'Samsung Galaxy S21' }
            }).isAndroid).toBe(true)

            expect(capabilitiesEnvironmentDetector({
                'bstack:options': { deviceName: 'Google Pixel 7' }
            }).isAndroid).toBe(true)

            expect(capabilitiesEnvironmentDetector({
                'bstack:options': { deviceName: 'OnePlus 9 Pro' }
            }).isAndroid).toBe(true)

            expect(capabilitiesEnvironmentDetector({
                'bstack:options': { deviceName: 'Nexus 5X' }
            }).isAndroid).toBe(true)
        })

        it('should detect Android by various manufacturer device names with sessionEnvironmentDetector', () => {
            const androidDevices = [
                'LG G8',
                'HTC One',
                'Motorola Edge',
                'Sony Xperia',
                'Huawei P30',
                'Vivo V21',
                'Oppo Find X3',
                'Xiaomi Mi 11',
                'Redmi Note 10',
                'Realme GT',
                'Samsung Galaxy Note'
            ]

            androidDevices.forEach(deviceName => {
                expect(sessionEnvironmentDetector({
                    capabilities: { 'bstack:options': { deviceName } },
                    requestedCapabilities: {}
                }).isAndroid).toBe(true)
            })
        })

        it('should detect Android by various manufacturer device names with capabilitiesEnvironmentDetector', () => {
            const androidDevices = [
                'LG G8',
                'HTC One',
                'Motorola Edge',
                'Sony Xperia',
                'Huawei P30',
                'Vivo V21',
                'Oppo Find X3',
                'Xiaomi Mi 11',
                'Redmi Note 10',
                'Realme GT',
                'Samsung Galaxy Note'
            ]

            androidDevices.forEach(deviceName => {
                expect(capabilitiesEnvironmentDetector({
                    'bstack:options': { deviceName }
                }).isAndroid).toBe(true)
            })
        })

        it('should not detect Android for non-Android device names with sessionEnvironmentDetector', () => {
            const nonAndroidDevices = [
                'iPhone 13',
                'iPad Pro',
                'iPhone SE',
                'iPad Mini',
                'Desktop Chrome',
                'MacBook Pro'
            ]

            nonAndroidDevices.forEach(deviceName => {
                expect(sessionEnvironmentDetector({
                    capabilities: { 'bstack:options': { deviceName } },
                    requestedCapabilities: {}
                }).isAndroid).toBe(false)
            })
        })

        it('should not detect Android for non-Android device names with capabilitiesEnvironmentDetector', () => {
            const nonAndroidDevices = [
                'iPhone 13',
                'iPad Pro',
                'iPhone SE',
                'iPad Mini',
                'Desktop Chrome',
                'MacBook Pro'
            ]

            nonAndroidDevices.forEach(deviceName => {
                expect(capabilitiesEnvironmentDetector({
                    'bstack:options': { deviceName }
                }).isAndroid).toBe(false)
            })
        })

        it('should detect Android case-insensitively by device name with both detectors', () => {
            expect(sessionEnvironmentDetector({
                capabilities: { 'bstack:options': { deviceName: 'SAMSUNG GALAXY S21' } },
                requestedCapabilities: {}
            }).isAndroid).toBe(true)

            expect(capabilitiesEnvironmentDetector({
                'bstack:options': { deviceName: 'google pixel 7' }
            }).isAndroid).toBe(true)

            expect(sessionEnvironmentDetector({
                capabilities: { 'bstack:options': { deviceName: 'Galaxy S22' } },
                requestedCapabilities: {}
            }).isAndroid).toBe(true)

            expect(capabilitiesEnvironmentDetector({
                'bstack:options': { deviceName: 'ONEPLUS 10' }
            }).isAndroid).toBe(true)
        })

        it('should detect Android when both platform and device name are present', () => {
            const capabilities = {
                platformName: 'Android',
                'bstack:options': { deviceName: 'Samsung Galaxy S21' }
            }

            expect(sessionEnvironmentDetector({
                capabilities,
                requestedCapabilities: {}
            }).isAndroid).toBe(true)

            expect(capabilitiesEnvironmentDetector(capabilities).isAndroid).toBe(true)
        })

        it('should detect Android when only device name is present without platform', () => {
            const capabilities = { 'bstack:options': { deviceName: 'Pixel 7' } }

            expect(sessionEnvironmentDetector({
                capabilities,
                requestedCapabilities: {}
            }).isAndroid).toBe(true)

            expect(capabilitiesEnvironmentDetector(capabilities).isAndroid).toBe(true)
        })

        it('should handle empty deviceName in bstack:options', () => {
            const capabilities = { 'bstack:options': { deviceName: '' } }

            expect(sessionEnvironmentDetector({
                capabilities,
                requestedCapabilities: {}
            }).isAndroid).toBe(false)

            expect(capabilitiesEnvironmentDetector(capabilities).isAndroid).toBe(false)
        })

        it('should handle missing deviceName in bstack:options', () => {
            const capabilities = { 'bstack:options': {} }

            expect(sessionEnvironmentDetector({
                capabilities,
                requestedCapabilities: {}
            }).isAndroid).toBe(false)

            expect(capabilitiesEnvironmentDetector(capabilities).isAndroid).toBe(false)
        })
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
            'appium:app': 'C:\\Program Files\\foo\\bar.exe',
            'appium:appArguments': '-noCloseConfirmationPopUp -shouldDisplayDiesToTake',
            'appium:automationName': 'Windows'
        }
        const requestedCapabilities = { browserName: '' }
        const { isMobile, isIOS, isAndroid, isWindowsApp } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(true)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
        expect(isWindowsApp).toEqual(true)
    })

    it('should detect a Mac application automated through Appium', () => {
        const capabilities: any = {
            platformName: 'mac',
            'appium:appPath': '/Applications/MyAppName.app',
            'appium:automationName': 'mac2'
        }
        const requestedCapabilities = { browserName: '' }
        const { isMobile, isIOS, isAndroid, isMacApp } = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        expect(isMobile).toEqual(true)
        expect(isIOS).toEqual(false)
        expect(isAndroid).toEqual(false)
        expect(isMacApp).toEqual(true)
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
        const capabilitiesFlags = capabilitiesEnvironmentDetector({})

        const expectedFlags = Object.keys(sessionFlags).filter(flagName => !['isW3C', 'isSeleniumStandalone'].includes(flagName))
        expect(Object.keys(capabilitiesFlags)).toEqual(expectedFlags)
    })
})
