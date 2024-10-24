import util from 'node:util'

import type { Capabilities, Frameworks } from '@wdio/types'

import type { ITestCaseHookParameter } from './cucumber-types.js'

import Listener from './testOps/listener.js'

import {
    getA11yResultsSummary,
    getA11yResults,
    performA11yScan,
    getUniqueIdentifier,
    getUniqueIdentifierForCucumber,
    isAccessibilityAutomationSession,
    isBrowserstackSession,
    o11yClassErrorHandler,
    shouldScanTestForAccessibility,
    validateCapsWithA11y,
    isTrue
} from './util.js'
import accessibilityScripts from './scripts/accessibility-scripts.js'

import { BStackLogger } from './bstackLogger.js'

class _AccessibilityHandler {
    private _platformA11yMeta: { [key: string]: any; }
    private _caps: Capabilities.RemoteCapability
    private _suiteFile?: string
    private _accessibility?: boolean
    private _accessibilityOptions?: { [key: string]: any; }
    private _testMetadata: { [key: string]: any; } = {}
    private static _a11yScanSessionMap: { [key: string]: any; } = {}
    private _sessionId: string | null = null
    private listener = Listener.getInstance()

    constructor (
        private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
        private _capabilities: Capabilities.RemoteCapability,
        isAppAutomate?: boolean,
        private _framework?: string,
        private _accessibilityAutomation?: boolean | string,
        private _accessibilityOpts?: { [key: string]: any; }
    ) {
        const caps = (this._browser as WebdriverIO.Browser).capabilities as WebdriverIO.Capabilities

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
                if ((caps as WebdriverIO.Capabilities)['bstack:options'] && (isTrue((caps as WebdriverIO.Capabilities)['bstack:options']?.accessibility))) {
                    return (caps as WebdriverIO.Capabilities)['bstack:options']?.accessibility
                } else if (isTrue((caps as WebdriverIO.Capabilities)['browserstack.accessibility'])) {
                    return (caps as WebdriverIO.Capabilities)['browserstack.accessibility']
                }
            } else if (capType === 'deviceName') {
                if ((caps as WebdriverIO.Capabilities)['bstack:options'] && (caps as WebdriverIO.Capabilities)['bstack:options']?.deviceName) {
                    return (caps as WebdriverIO.Capabilities)['bstack:options']?.deviceName
                } else if ((caps as WebdriverIO.Capabilities)['bstack:options'] && (caps as WebdriverIO.Capabilities)['bstack:options']?.device) {
                    return (caps as WebdriverIO.Capabilities)['bstack:options']?.device
                } else if ((caps as WebdriverIO.Capabilities)['appium:deviceName']) {
                    return (caps as WebdriverIO.Capabilities)['appium:deviceName']
                }
            } else if (capType === 'goog:chromeOptions' && (caps as WebdriverIO.Capabilities)['goog:chromeOptions']) {
                return (caps as WebdriverIO.Capabilities)['goog:chromeOptions']
            } else {
                const bstackOptions = (caps as WebdriverIO.Capabilities)['bstack:options']
                if ( bstackOptions && bstackOptions?.[capType as keyof Capabilities.BrowserStackCapabilities]) {
                    return bstackOptions?.[capType as keyof Capabilities.BrowserStackCapabilities]
                } else if ((caps as WebdriverIO.Capabilities)[legacyCapType as keyof WebdriverIO.Capabilities]) {
                    return (caps as WebdriverIO.Capabilities)[legacyCapType as keyof WebdriverIO.Capabilities]
                }
            }
        }
    }

    async before (sessionId: string) {
        this._sessionId = sessionId
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

        (this._browser as WebdriverIO.Browser).performScan = async () => {
            return await performA11yScan((this._browser as WebdriverIO.Browser), isBrowserstackSession(this._browser), this._accessibility)
        }

        if (!this._accessibility) {
            return
        }
        if (!('overwriteCommand' in this._browser && Array.isArray(accessibilityScripts.commandsToWrap))) {
            return
        }

        accessibilityScripts.commandsToWrap
            .filter((command) => command.name && command.class)
            .forEach((command) => {
                const browser = this._browser as WebdriverIO.Browser
                browser.overwriteCommand(command.name, this.commandWrapper.bind(this, command), command.class === 'Element')
            })
    }

    async beforeTest (suiteTitle: string | undefined, test: Frameworks.Test) {
        try {
            if (
                this._framework !== 'mocha' ||
                !this.shouldRunTestHooks(this._browser, this._accessibility)
            ) {
                /* This is to be used when test events are sent */
                Listener.setTestRunAccessibilityVar(false)
                return
            }

            const shouldScanTest = shouldScanTestForAccessibility(suiteTitle, test.title, this._accessibilityOptions)
            const testIdentifier = this.getIdentifier(test)
            const isPageOpened = await this.checkIfPageOpened(this._browser, testIdentifier, shouldScanTest)

            if (this._sessionId) {
                /* For case with multiple tests under one browser, before hook of 2nd test should change this map value */
                AccessibilityHandler._a11yScanSessionMap[this._sessionId] = shouldScanTest
            }

            /* This is to be used when test events are sent */
            Listener.setTestRunAccessibilityVar(this._accessibility && shouldScanTest)

            if (!isPageOpened) {
                return
            }

            this._testMetadata[testIdentifier].accessibilityScanStarted = shouldScanTest

            if (shouldScanTest) {
                BStackLogger.info('Automate test case execution has started.')
            }
        } catch (error) {
            BStackLogger.error(`Exception in starting accessibility automation scan for this test case ${error}`)
        }
    }

    async afterTest (suiteTitle: string | undefined, test: Frameworks.Test) {
        BStackLogger.debug('Accessibility after test hook. Before sending test stop event')
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
                BStackLogger.info('Automate test case execution has ended. Processing for accessibility testing is underway. ')

                const dataForExtension = {
                    'thTestRunUuid': process.env.TEST_ANALYTICS_ID,
                    'thBuildUuid': process.env.BROWSERSTACK_TESTHUB_UUID,
                    'thJwtToken': process.env.BROWSERSTACK_TESTHUB_JWT
                }

                await this.sendTestStopEvent((this._browser as WebdriverIO.Browser), dataForExtension)

                BStackLogger.info('Accessibility testing for this test case has ended.')
            }
        } catch (error) {
            BStackLogger.error(`Accessibility results could not be processed for the test case ${test.title}. Error : ${error}`)
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
        if (!this.shouldRunTestHooks(this._browser, this._accessibility)) {
            /* This is to be used when test events are sent */
            Listener.setTestRunAccessibilityVar(false)
            return
        }

        try {
            const shouldScanScenario = shouldScanTestForAccessibility(featureData?.name, pickleData.name, this._accessibilityOptions, world, true)
            const isPageOpened = await this.checkIfPageOpened(this._browser, uniqueId, shouldScanScenario)

            if (this._sessionId) {
                /* For case with multiple tests under one browser, before hook of 2nd test should change this map value */
                AccessibilityHandler._a11yScanSessionMap[this._sessionId] = shouldScanScenario
            }

            /* This is to be used when test events are sent */
            Listener.setTestRunAccessibilityVar(this._accessibility && shouldScanScenario)

            if (!isPageOpened) {
                return
            }

            this._testMetadata[uniqueId].accessibilityScanStarted = shouldScanScenario

            if (shouldScanScenario) {
                BStackLogger.info('Automate test case execution has started.')
            }
        } catch (error) {
            BStackLogger.error(`Exception in starting accessibility automation scan for this test case ${error}`)
        }
    }

    async afterScenario (world: ITestCaseHookParameter) {
        BStackLogger.debug('Accessibility after scenario hook. Before sending test stop event')
        if (!this.shouldRunTestHooks(this._browser, this._accessibility)) {
            return
        }

        const pickleData = world.pickle
        try {
            const uniqueId = getUniqueIdentifierForCucumber(world)
            const accessibilityScanStarted = this._testMetadata[uniqueId]?.accessibilityScanStarted
            const shouldScanTestForAccessibility = this._testMetadata[uniqueId]?.scanTestForAccessibility

            if (!accessibilityScanStarted) {
                return
            }

            if (shouldScanTestForAccessibility) {
                BStackLogger.info('Automate test case execution has ended. Processing for accessibility testing is underway. ')

                const dataForExtension = {
                    'thTestRunUuid': process.env.TEST_ANALYTICS_ID,
                    'thBuildUuid': process.env.BROWSERSTACK_TESTHUB_UUID,
                    'thJwtToken': process.env.BROWSERSTACK_TESTHUB_JWT
                }

                await this.sendTestStopEvent(( this._browser as WebdriverIO.Browser), dataForExtension)

                BStackLogger.info('Accessibility testing for this test case has ended.')
            }
        } catch (error) {
            BStackLogger.error(`Accessibility results could not be processed for the test case ${pickleData.name}. Error : ${error}`)
        }
    }

    /*
     * private methods
     */

    private async commandWrapper (command: any, origFunction: Function, ...args: any[]) {
        if (
            this._sessionId && AccessibilityHandler._a11yScanSessionMap[this._sessionId] &&
                (
                    !command.name.includes('execute') ||
                    !AccessibilityHandler.shouldPatchExecuteScript(args.length ? args[0] : null)
                )
        ) {
            BStackLogger.debug(`Performing scan for ${command.class} ${command.name}`)
            await performA11yScan(this._browser, true, true, command.name)
        }
        return origFunction(...args)
    }

    private async sendTestStopEvent(browser: WebdriverIO.Browser, dataForExtension: any) {
        BStackLogger.debug('Performing scan before saving results')
        await performA11yScan(browser, true, true)
        const results: unknown = await (browser as WebdriverIO.Browser).executeAsync(accessibilityScripts.saveTestResults as string, dataForExtension)
        BStackLogger.debug(util.format(results as string))
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

    private static shouldPatchExecuteScript(script: string | null): Boolean {
        if (!script || typeof script !== 'string') {
            return true
        }

        return (
            script.toLowerCase().indexOf('browserstack_executor') !== -1 ||
            script.toLowerCase().indexOf('browserstack_accessibility_automation_script') !== -1
        )
    }
}

// https://github.com/microsoft/TypeScript/issues/6543
const AccessibilityHandler: typeof _AccessibilityHandler = o11yClassErrorHandler(_AccessibilityHandler)
type AccessibilityHandler = _AccessibilityHandler

export default AccessibilityHandler
