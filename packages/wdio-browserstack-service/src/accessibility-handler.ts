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
    isTrue,
} from './util.js'
import { testForceStop, testStartEvent, testStop } from './scripts/test-event-scripts.js'

const log = logger('@wdio/browserstack-service')

class _AccessibilityHandler {
    private _platformA11yMeta: { [key: string]: any; }
    private _caps: Capabilities.RemoteCapability
    private _suiteFile?: string
    private _accessibility?: boolean
    private _accessibilityOptions?: { [key: string]: any; }
    private _testMetadata: { [key: string]: any; } = {}

    constructor (
        private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
        private _capabilities: Capabilities.RemoteCapability,
        isAppAutomate?: boolean,
        private _framework?: string,
        private _accessibilityAutomation?: boolean | string,
        private _accessibilityOpts?: { [key: string]: any; }
    ) {
        const caps = (this._browser as WebdriverIO.Browser).capabilities as Capabilities.Capabilities

        this._platformA11yMeta = {
            browser_name: caps.browserName,
            browser_version: caps?.browserVersion || (caps as Capabilities.DesiredCapabilities)?.version || 'latest',
            os_name: this._getCapabilityValue(_capabilities, 'os', 'os'),
            os_version: this._getCapabilityValue(_capabilities, 'osVersion', 'os_version')
        }

        this._caps = _capabilities
        this._accessibility = isTrue(_accessibilityAutomation)
        this._accessibilityOptions = _accessibilityOpts
    }

    setSuiteFile(filename: string) {
        this._suiteFile = filename
    }

    _getCapabilityValue(caps: Capabilities.RemoteCapability, capType: string, legacyCapType: string) {
        if (caps) {
            if (capType === 'accessibility') {
                if ((caps as Capabilities.Capabilities)['bstack:options'] && (isTrue((caps as Capabilities.Capabilities)['bstack:options']?.accessibility))) {
                    return (caps as Capabilities.Capabilities)['bstack:options']?.accessibility
                } else if (isTrue((caps as Capabilities.Capabilities)['browserstack.accessibility'])) {
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
                const bstackOptions = (caps as Capabilities.Capabilities)['bstack:options']
                if ( bstackOptions && bstackOptions?.[capType as keyof Capabilities.BrowserStackCapabilities]) {
                    return bstackOptions?.[capType as keyof Capabilities.BrowserStackCapabilities]
                } else if ((caps as Capabilities.Capabilities)[legacyCapType as keyof Capabilities.Capabilities]) {
                    return (caps as Capabilities.Capabilities)[legacyCapType as keyof Capabilities.Capabilities]
                }
            }
        }
    }

    async before () {
        this._accessibility = isTrue(this._getCapabilityValue(this._caps, 'accessibility', 'browserstack.accessibility'))

        if (isBrowserstackSession(this._browser) && isAccessibilityAutomationSession(this._accessibility)) {
            const deviceName = this._getCapabilityValue(this._caps, 'deviceName', 'device')
            const chromeOptions = this._getCapabilityValue(this._caps, 'goog:chromeOptions', '')

            this._accessibility = validateCapsWithA11y(deviceName, this._platformA11yMeta, chromeOptions)
        }

        (this._browser as WebdriverIO.Browser).getAccessibilityResultsSummary = async () => {
            return await getA11yResultsSummary((this._browser as WebdriverIO.Browser), isBrowserstackSession(this._browser), this._accessibility)
        }

        (this._browser as WebdriverIO.Browser).getAccessibilityResults = async () => {
            return await getA11yResults((this._browser as WebdriverIO.Browser), isBrowserstackSession(this._browser), this._accessibility)
        }
    }

    async beforeTest (suiteTitle: string | undefined, test: Frameworks.Test) {
        if (
            this._framework !== 'mocha' ||
            !this.shouldRunTestHooks(this._browser, this._accessibility)
        ) {
            return
        }

        const shouldScanTest = shouldScanTestForAccessibility(suiteTitle, test.title, this._accessibilityOptions)
        const testIdentifier = this.getIdentifier(test)
        const isPageOpened = await this.checkIfPageOpened(this._browser, testIdentifier, shouldScanTest)

        if (!isPageOpened) {
            return
        }

        try {
            if (shouldScanTest) {
                log.info('Setup for Accessibility testing has started. Automate test case execution will begin momentarily.')
                await this.sendTestStartEvent(this._browser as WebdriverIO.Browser)
            } else {
                await this.sendTestForceStopEvent(this._browser as WebdriverIO.Browser)
            }
            this._testMetadata[testIdentifier].accessibilityScanStarted = shouldScanTest

            if (shouldScanTest) {
                log.info('Automate test case execution has started.')
            }
        } catch (error) {
            log.error(`Exception in starting accessibility automation scan for this test case ${error}`)
        }
    }

    async afterTest (suiteTitle: string | undefined, test: Frameworks.Test) {
        if (
            this._framework !== 'mocha' ||
            !this.shouldRunTestHooks(this._browser, this._accessibility)
        ) {
            return
        }

        try {
            const testIdentifier = this.getIdentifier(test)
            const accessibilityScanStarted = this._testMetadata[testIdentifier]?.accessibilityScanStarted
            const shouldScanTestForAccessibility = this._testMetadata[testIdentifier]?.scanTestForAccessibility

            if (!accessibilityScanStarted) {
                return
            }

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
        } catch (error) {
            log.error(`Accessibility results could not be processed for the test case ${test.title}. Error :`, error)
        }
    }

    /**
      * Cucumber Only
    */
    async beforeScenario (world: ITestCaseHookParameter) {
        if (!this.shouldRunTestHooks(this._browser, this._accessibility)) {
            return
        }

        const pickleData = world.pickle
        const gherkinDocument = world.gherkinDocument
        const featureData = gherkinDocument.feature
        const uniqueId = getUniqueIdentifierForCucumber(world)
        const shouldScanScenario = shouldScanTestForAccessibility(featureData?.name, pickleData.name, this._accessibilityOptions)
        const isPageOpened = await this.checkIfPageOpened(this._browser, uniqueId, shouldScanScenario)

        if (!isPageOpened) {
            return
        }

        try {
            if (shouldScanScenario) {
                log.info('Setup for Accessibility testing has started. Automate test case execution will begin momentarily.')
                await this.sendTestStartEvent(this._browser as WebdriverIO.Browser)
            } else {
                await this.sendTestForceStopEvent(this._browser as WebdriverIO.Browser)
            }
            this._testMetadata[uniqueId].accessibilityScanStarted = shouldScanScenario

            if (shouldScanScenario) {
                log.info('Automate test case execution has started.')
            }
        } catch (error) {
            log.error(`Exception in starting accessibility automation scan for this test case ${error}`)
        }
    }

    async afterScenario (world: ITestCaseHookParameter) {
        if (!this.shouldRunTestHooks(this._browser, this._accessibility)) {
            return
        }

        const pickleData = world.pickle
        try {
            const gherkinDocument = world.gherkinDocument
            const featureData = gherkinDocument.feature
            const uniqueId = getUniqueIdentifierForCucumber(world)
            const accessibilityScanStarted = this._testMetadata[uniqueId]?.accessibilityScanStarted
            const shouldScanTestForAccessibility = this._testMetadata[uniqueId]?.scanTestForAccessibility

            if (!accessibilityScanStarted) {
                return
            }

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
        } catch (error) {
            log.error(`Accessibility results could not be processed for the test case ${pickleData.name}. Error :`, error)
        }
    }

    /*
     * private methods
     */

    private sendTestStartEvent(browser: WebdriverIO.Browser) {
        return (browser as WebdriverIO.Browser).executeAsync(testStartEvent)
    }

    private sendTestForceStopEvent(browser: WebdriverIO.Browser) {
        return (browser as WebdriverIO.Browser).execute(testForceStop)
    }

    private sendTestStopEvent(browser: WebdriverIO.Browser, dataForExtension: any) {
        return (browser as WebdriverIO.Browser).executeAsync(testStop, dataForExtension)
    }

    private getIdentifier (test: Frameworks.Test | ITestCaseHookParameter) {
        if ('pickle' in test) {
            return getUniqueIdentifierForCucumber(test)
        }
        return getUniqueIdentifier(test, this._framework)
    }

    private shouldRunTestHooks(browser: any, isAccessibility?: boolean | string) {
        if (!browser) {
            return false
        }
        return isBrowserstackSession(browser) && isAccessibilityAutomationSession(isAccessibility)
    }

    private async checkIfPageOpened(browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, testIdentifier: string, shouldScanTest?: boolean) {
        let pageOpen = false
        this._testMetadata[testIdentifier] = {
            scanTestForAccessibility : shouldScanTest,
            accessibilityScanStarted : true
        }

        try {
            const currentURL = await (browser as WebdriverIO.Browser).getUrl()
            const url = new URL(currentURL)
            pageOpen = url?.protocol === 'http:' || url?.protocol === 'https:'
        } catch (e) {
            pageOpen = false
        }

        return pageOpen
    }
}

// https://github.com/microsoft/TypeScript/issues/6543
const AccessibilityHandler: typeof _AccessibilityHandler = o11yClassErrorHandler(_AccessibilityHandler)
type AccessibilityHandler = _AccessibilityHandler

export default AccessibilityHandler

