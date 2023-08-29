import logger from '@wdio/logger'
import type { Capabilities, Frameworks } from '@wdio/types'

import type { ITestCaseHookParameter } from './cucumber-types.js'

import {
    getA11yResultsSummary,
    getA11yResults,
    getUniqueIdentifier,
    getUniqueIdentifierForCucumber,
    isAccessibilityAutomationSession,
    isBrowserstackSession,
    o11yClassErrorHandler,
    shouldScanTestForAccessibility,
    validateCapsWithA11y,
} from './util.js'
import type { TestMeta, BrowserStack } from './types.js'
import type { BrowserStackCapabilities } from '@wdio/types/build/Capabilities.js'

const log = logger('@wdio/browserstack-service')

class _AccessibilityHandler {
    private _tests: Record<string, TestMeta> = {}
    private _hooks: Record<string, string[]> = {}
    private _platformA11yMeta: { [key: string]: any; }
    private _caps: Capabilities.RemoteCapability
    private _suiteFile?: string
    private _accessibility?: string | boolean
    private _accessibilityOptions?: { [key: string]: any; }
    private _testMetadata: { [key: string]: any; } = {}

    constructor (private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, private _capabilities: Capabilities.RemoteCapability, isAppAutomate?: boolean, private _framework?: string, private _accessibilityAutomation?: boolean | string, private _accessibilityOpts?: { [key: string]: any; }) {
        const caps = (this._browser as WebdriverIO.Browser).capabilities as Capabilities.Capabilities

        this._platformA11yMeta = {
            browser_name: caps.browserName,
            browser_version: caps?.browserVersion || (caps as Capabilities.DesiredCapabilities)?.version || 'latest',
            os_name: this._getCapabilityValue(_capabilities, 'os', 'os'),
            os_version: this._getCapabilityValue(_capabilities, 'osVersion', 'os_version')
        }

        this._caps = _capabilities
        this._accessibility = (_accessibilityAutomation + '') === 'true'
        this._accessibilityOptions = _accessibilityOpts
    }

    setSuiteFile(filename: string) {
        this._suiteFile = filename
    }

    _getCapabilityValue(caps: Capabilities.RemoteCapability, capType: string, legacyCapType: string) {
        if (caps) {
            if (capType === 'accessibility') {
                if ((caps as Capabilities.Capabilities)['bstack:options'] && ((caps as Capabilities.Capabilities)['bstack:options']?.accessibility + '' === 'true')) {
                    return (caps as Capabilities.Capabilities)['bstack:options']?.accessibility
                } else if (((caps as Capabilities.Capabilities)['browserstack.accessibility'] + '') === 'true') {
                    return (caps as Capabilities.Capabilities)['browserstack.accessibility']
                }
            } else if (capType === 'deviceName') {
                if ((caps as Capabilities.Capabilities)['bstack:options'] && (caps as Capabilities.Capabilities)['bstack:options']?.deviceName) {
                    return (caps as Capabilities.Capabilities)['bstack:options']?.deviceName
                } else if ((caps as Capabilities.Capabilities)['bstack:options'] && (caps as Capabilities.Capabilities)['bstack:options']?.device) {
                    return (caps as Capabilities.Capabilities)['bstack:options']?.device
                } else if ((caps as Capabilities.Capabilities)['appium:deviceName']) {
                    return (caps as Capabilities.Capabilities)['appium:deviceName']
                }
            } else if (capType === 'goog:chromeOptions' && (caps as Capabilities.Capabilities)['goog:chromeOptions']) {
                return (caps as Capabilities.Capabilities)['goog:chromeOptions']
            } else {
                if ((caps as Capabilities.Capabilities)['bstack:options'] && (caps as Capabilities.Capabilities)['bstack:options']?.[capType as keyof BrowserStackCapabilities]) {
                    return (caps as Capabilities.Capabilities)['bstack:options']?.[capType as keyof BrowserStackCapabilities]
                } else if ((caps as Capabilities.Capabilities)[legacyCapType as keyof Capabilities.Capabilities]) {
                    return (caps as Capabilities.Capabilities)[legacyCapType as keyof Capabilities.Capabilities]
                }
            }
        }
    }

    async before () {
        if (isBrowserstackSession(this._browser) && isAccessibilityAutomationSession(this._accessibility) && this._getCapabilityValue(this._caps, 'accessibility', 'browserstack.accessibility')) {
            const deviceName = this._getCapabilityValue(this._caps, 'deviceName', 'device')
            const chromeOptions = this._getCapabilityValue(this._caps, 'goog:chromeOptions', '')

            this._accessibility = validateCapsWithA11y(deviceName, this._platformA11yMeta, chromeOptions)
        } else {
            this._accessibility = (this._getCapabilityValue(this._caps, 'accessibility', 'browserstack.accessibility') + '') === 'true'
        }

        (this._browser as BrowserStack).getAccessibilityResultsSummary = async () => {
            return await getA11yResultsSummary((this._browser as WebdriverIO.Browser), isBrowserstackSession(this._browser), this._accessibility)
        }

        (this._browser as BrowserStack).getAccessibilityResults = async () => {
            return await getA11yResults((this._browser as WebdriverIO.Browser), isBrowserstackSession(this._browser), this._accessibility)
        }
    }

    async beforeTest (suiteTitle: string | undefined, test: Frameworks.Test) {
        if (this._framework !== 'mocha') {
            return
        }

        if (isBrowserstackSession(this._browser)) {
            const shouldScanTest = shouldScanTestForAccessibility(suiteTitle, test.title, this._accessibilityOptions)
            const testIdentifier = this.getIdentifier(test)
            this._testMetadata[testIdentifier] = {
                scanTestForAccessibility : shouldScanTest,
                accessibilityScanStarted : true
            }

            if (this._browser && isAccessibilityAutomationSession(this._accessibility)) {
                let url
                let pageOpen = true
                const currentURL = await (this._browser as WebdriverIO.Browser).getUrl()

                try {
                    url = new URL(currentURL)
                } catch (e) {
                    pageOpen = false
                }
                pageOpen = url?.protocol === 'http:' || url?.protocol === 'https:'

                try {
                    if (pageOpen) {
                        if (shouldScanTest) {
                            log.info('Setup for Accessibility testing has started. Automate test case execution will begin momentarily.')
                            await (this._browser as WebdriverIO.Browser).executeAsync(() => {
                                const callback = arguments[arguments.length - 1]
                                const fn = () => {
                                    window.addEventListener('A11Y_TAP_STARTED', fn2)
                                    const e = new CustomEvent('A11Y_FORCE_START')
                                    window.dispatchEvent(e)
                                }
                                const fn2 = () => {
                                    window.removeEventListener('A11Y_TAP_STARTED', fn)
                                    callback()
                                }
                                fn()
                            })
                        } else {
                            await (this._browser as WebdriverIO.Browser).execute(() => {
                                const e = new CustomEvent('A11Y_FORCE_STOP')
                                window.dispatchEvent(e)
                            })
                        }
                        this._testMetadata[testIdentifier].accessibilityScanStarted = shouldScanTest

                        if (shouldScanTest) {
                            log.info('Automate test case execution has started.')
                        }
                    }
                } catch (error) {
                    log.error(`Exception in starting accessibility automation scan for this test case ${error}`)
                }
            }
        }
    }

    async afterTest (suiteTitle: string | undefined, test: Frameworks.Test) {
        if (this._framework !== 'mocha') {
            return
        }

        try {
            if (isBrowserstackSession(this._browser)) {
                const testIdentifier = this.getIdentifier(test)
                const accessibilityScanStarted = this._testMetadata[testIdentifier]?.accessibilityScanStarted
                const shouldScanTestForAccessibility = this._testMetadata[testIdentifier]?.scanTestForAccessibility

                if (accessibilityScanStarted && isAccessibilityAutomationSession(this._accessibility)) {
                    if (shouldScanTestForAccessibility) {
                        log.info('Automate test case execution has ended. Processing for accessibility testing is underway. ')
                    }
                    const dataForExtension = {
                        saveResults: shouldScanTestForAccessibility,
                        testDetails: {
                            'name': test.title,
                            'testRunId': process.env.BS_A11Y_TEST_RUN_ID,
                            'filePath': this._suiteFile,
                            'scopeList': [suiteTitle, test.title]
                        },
                        platform: this._platformA11yMeta
                    }

                    await this.sendTestStopEvent((this._browser as WebdriverIO.Browser), dataForExtension)

                    if (shouldScanTestForAccessibility) {
                        log.info('Accessibility testing for this test case has ended.')
                    }
                }
            }
        } catch (er) {
            log.error(`Accessibility results could not be processed for the test case ${test.title}. Error :`, er)
        }
    }

    /**
      * Cucumber Only
    */

    async beforeScenario (world: ITestCaseHookParameter) {
        const pickleData = world.pickle
        const gherkinDocument = world.gherkinDocument
        const featureData = gherkinDocument.feature
        const uniqueId = getUniqueIdentifierForCucumber(world)

        if (isBrowserstackSession(this._browser)) {
            const shouldScanScenario = shouldScanTestForAccessibility(featureData?.name, pickleData.name, this._accessibilityOptions)
            this._testMetadata[uniqueId] = {
                scanTestForAccessibility : shouldScanScenario,
                accessibilityScanStarted : true
            }

            if (this._browser && isAccessibilityAutomationSession(this._accessibility)) {
                let url
                let pageOpen = true
                const currentURL = await (this._browser as WebdriverIO.Browser).getUrl()

                try {
                    url = new URL(currentURL)
                } catch (e) {
                    pageOpen = false
                }
                pageOpen = url?.protocol === 'http:' || url?.protocol === 'https:'

                try {
                    if (pageOpen) {
                        if (shouldScanScenario) {
                            log.info('Setup for Accessibility testing has started. Automate test case execution will begin momentarily.')
                            await (this._browser as WebdriverIO.Browser).executeAsync(() => {
                                const callback = arguments[arguments.length - 1]
                                const fn = () => {
                                    window.addEventListener('A11Y_TAP_STARTED', fn2)
                                    const e = new CustomEvent('A11Y_FORCE_START')
                                    window.dispatchEvent(e)
                                }
                                const fn2 = () => {
                                    window.removeEventListener('A11Y_TAP_STARTED', fn)
                                    callback()
                                }
                                fn()
                            })
                        } else {
                            await (this._browser as WebdriverIO.Browser).execute(() => {
                                const e = new CustomEvent('A11Y_FORCE_STOP')
                                window.dispatchEvent(e)
                            })
                        }
                        this._testMetadata[uniqueId].accessibilityScanStarted = shouldScanScenario

                        if (shouldScanScenario) {
                            log.info('Automate test case execution has started.')
                        }
                    }
                } catch (error) {
                    log.error(`Exception in starting accessibility automation scan for this test case ${error}`)
                }
            }
        }
    }

    async afterScenario (world: ITestCaseHookParameter) {
        const pickleData = world.pickle
        const gherkinDocument = world.gherkinDocument
        const featureData = gherkinDocument.feature
        const uniqueId = getUniqueIdentifierForCucumber(world)

        try {
            if (isBrowserstackSession(this._browser)) {
                const accessibilityScanStarted = this._testMetadata[uniqueId]?.accessibilityScanStarted
                const shouldScanTestForAccessibility = this._testMetadata[uniqueId]?.scanTestForAccessibility

                if (accessibilityScanStarted && isAccessibilityAutomationSession(this._accessibility)) {
                    if (shouldScanTestForAccessibility) {
                        log.info('Automate test case execution has ended. Processing for accessibility testing is underway. ')
                    }
                    const dataForExtension = {
                        saveResults: shouldScanTestForAccessibility,
                        testDetails: {
                            'name': pickleData.name,
                            'testRunId': process.env.BS_A11Y_TEST_RUN_ID,
                            'filePath': gherkinDocument.uri,
                            'scopeList': [featureData?.name, pickleData.name]
                        },
                        platform: this._platformA11yMeta
                    }

                    await this.sendTestStopEvent(( this._browser as WebdriverIO.Browser), dataForExtension)

                    if (shouldScanTestForAccessibility) {
                        log.info('Accessibility testing for this test case has ended.')
                    }
                }
            }
        } catch (er) {
            log.error(`Accessibility results could not be processed for the test case ${pickleData.name}. Error :`, er)
        }
    }

    /*
     * private methods
     */

    private sendTestStopEvent(browser: WebdriverIO.Browser, dataForExtension: any) {
        return (browser as WebdriverIO.Browser).executeAsync(`
            const callback = arguments[arguments.length - 1];

            this.res = null;
            if (arguments[0].saveResults) {
            window.addEventListener('A11Y_TAP_TRANSPORTER', (event) => {
                window.tapTransporterData = event.detail;
                this.res = window.tapTransporterData;
                callback(this.res);
            });
            }
            const e = new CustomEvent('A11Y_TEST_END', {detail: arguments[0]});
            window.dispatchEvent(e);
            if (arguments[0].saveResults !== true ) {
            callback();
            }
        `, dataForExtension)
    }

    private getIdentifier (test: Frameworks.Test | ITestCaseHookParameter) {
        if ('pickle' in test) {
            return getUniqueIdentifierForCucumber(test)
        }
        return getUniqueIdentifier(test, this._framework)
    }
}

// https://github.com/microsoft/TypeScript/issues/6543
const AccessibilityHandler: typeof _AccessibilityHandler = o11yClassErrorHandler(_AccessibilityHandler)
type AccessibilityHandler = _AccessibilityHandler

export default AccessibilityHandler

