/// <reference path="../../@types/bstack-service-types.d.ts" />
import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import type TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import { HookState } from '../states/hookState.js'
import accessibilityScripts from '../../scripts/accessibility-scripts.js'
import { _getParamsForAppAccessibility, formatString, getAppA11yResults, getAppA11yResultsSummary, shouldScanTestForAccessibility, validateCapsWithA11y, validateCapsWithAppA11y, validateCapsWithNonBstackA11y } from '../../util.js'
import { AutomationFrameworkConstants } from '../frameworks/constants/automationFrameworkConstants.js'
import util from 'node:util'
import type { Accessibility } from '@browserstack/wdio-browserstack-service'
import type { Capabilities } from '@wdio/types'
import PerformanceTester from '../../instrumentation/performance/performance-tester.js'
import * as PERFORMANCE_SDK_EVENTS from '../../instrumentation/performance/constants.js'
import type { FetchDriverExecuteParamsEventRequest, FetchDriverExecuteParamsEventResponse } from '@browserstack/wdio-browserstack-service'
import { GrpcClient } from '../grpcClient.js'

export default class AccessibilityModule extends BaseModule {

    logger = BStackLogger
    name: string
    scriptInstance: typeof accessibilityScripts
    accessibility: boolean = false
    isAppAccessibility: boolean
    isNonBstackA11y: boolean
    accessibilityConfig: Accessibility
    static MODULE_NAME = 'AccessibilityModule'
    accessibilityMap: Map<number, boolean>
    LOG_DISABLED_SHOWN: Map<number, boolean>

    constructor(accessibilityConfig: Accessibility, isNonBstackA11y: boolean) {
        super()
        this.name = 'AccessibilityModule'
        this.accessibilityConfig = accessibilityConfig
        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.POST, this.onBeforeExecute.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.PRE, this.onBeforeTest.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))
        this.accessibility = true
        this.scriptInstance = accessibilityScripts
        this.accessibilityMap = new Map()
        this.LOG_DISABLED_SHOWN = new Map()
        this.isAppAccessibility = accessibilityConfig.isAppAccessibility || false
        this.isNonBstackA11y = isNonBstackA11y
    }

    async onBeforeExecute() {
        try {
            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()

            if (!autoInstance) {
                this.logger.debug('No tracked instances found!')
                return
            }

            const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser

            if (!browser) {
                this.logger.debug('No browser instance found for command wrapping')
                return
            }

            const isBrowserstackSession = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB)
            const browserCaps = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_CAPABILITIES)
            const inputCaps = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_INPUT_CAPABILITIES)
            const sessionId = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)
            const platformA11yMeta = {
                browser_name: browserCaps.browserName,
                browser_version: browserCaps?.browserVersion || 'latest',
                platform_name: browserCaps?.platformName,
                platform_version: this.getCapability(browserCaps, 'appium:platformVersion', 'platformVersion'),
            }
            if (this.isAppAccessibility) {
                this.accessibility = validateCapsWithAppA11y(platformA11yMeta)
            } else if (this.isNonBstackA11y){
                if (validateCapsWithNonBstackA11y(platformA11yMeta.browser_name as string, platformA11yMeta.browser_version as string)){
                    this.accessibility = true
                }
            } else {
                const device = this.getCapability(inputCaps, 'deviceName')
                const chromeOptions = this.getCapability(inputCaps, 'goog:chromeOptions')
                this.accessibility = validateCapsWithA11y(device, platformA11yMeta, chromeOptions)
            }

            //patching getA11yResultsSummary
            (browser as any).getAccessibilityResultsSummary = async () => {
                if (this.isAppAccessibility) {
                    return await getAppA11yResultsSummary(true, browser, isBrowserstackSession, this.accessibility, sessionId)
                }
                return await this.getA11yResultsSummary(browser)
            }

            //patching getA11yResults
            (browser as any).getAccessibilityResults = async () => {
                if (this.isAppAccessibility) {
                    return await getAppA11yResults(true, browser, isBrowserstackSession, this.accessibility, sessionId)
                }
                return await this.getA11yResults(browser)
            }

            //patching performScan
            (browser as any).performScan = async () => {
                return await this.performScanCli(browser)
            }

            if (!this.accessibility) {
                this.logger.info('Accessibility automation is disabled for this session.')
                return
            }

            if (!('overwriteCommand' in browser && Array.isArray(this.scriptInstance.commandsToWrap))) {
                return
            }

            // Wrap commands if accessibility scripts are available
            if (this.scriptInstance.commandsToWrap && this.scriptInstance.commandsToWrap.length > 0) {
                this.scriptInstance.commandsToWrap
                    .filter((command) => command.name && command.class)
                    .forEach((command) => {
                        browser.overwriteCommand(
                            command.name,
                            this.commandWrapper.bind(this, command),
                            command.class === 'Element'
                        )
                    })
            }

        } catch (error) {
            this.logger.error(`Error in onBeforeExecute: ${error}`)
        }
    }

    private async commandWrapper(command: any, originFunction: Function, ...args: any[]) {
        try {
            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
            const sessionId = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)
            // Check if accessibility is still enabled for this session
            if (sessionId && this.accessibilityMap.get(sessionId)) {
                const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser

                // Perform accessibility scan before command if script is available
                if (
                    !command.name.includes('execute') ||
                    !this.shouldPatchExecuteScript(args.length ? args[0] : null)
                ) {
                    try {
                        await this.performScanCli(browser, command.name)
                        this.logger.debug(`Accessibility scan performed after ${command.name} command`)
                    } catch (scanError) {
                        this.logger.debug(`Error performing accessibility scan after ${command.name}: ${scanError}`)
                    }
                }
            }

            // Execute the original command
            const result = await originFunction(...args)

            return result

        } catch (error) {
            this.logger.error(`Error in commandWrapper for ${command.name}: ${error}`)
            // Still execute the original command even if accessibility scan fails
            return await originFunction(...args)
        }
    }

    async onBeforeTest(args: any) {
        try {
            this.logger.debug('Accessibility before test hook. Starting accessibility scan for this test case.')
            const suiteTitle = args.suiteTitle || ''
            const test = args.test || {}

            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
            const testInstance: TestFrameworkInstance = TestFramework.getTrackedInstance()

            const sessionId = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)
            const accessibilityOptions = this.config.accessibilityOptions
            const shouldScanTest = shouldScanTestForAccessibility(suiteTitle, test.title, accessibilityOptions as { [key: string]: any } | undefined) && this.accessibility

            // Create test metadata similar to accessibility-handler
            const testIdentifier = testInstance.getContext().getId()
            const testMetadata = {
                scanTestForAccessibility: shouldScanTest,
                accessibilityScanStarted: shouldScanTest
            }

            // Store test metadata in test instance
            TestFramework.setState(testInstance, `accessibility_metadata_${testIdentifier}`, testMetadata)
            this.accessibilityMap.set(sessionId, shouldScanTest)

            // Log if accessibility scan is enabled for this test
            if (shouldScanTest) {
                this.logger.info('Accessibility test case execution has started.')
            } else if (!this.LOG_DISABLED_SHOWN.get(sessionId)) {
                this.logger.info('Accessibility scanning disabled for this test case.')
                this.LOG_DISABLED_SHOWN.set(sessionId, true)
            }

        } catch (error) {
            this.logger.error(`Exception in starting accessibility automation scan for this test case: ${error}`)
        }
    }

    async onAfterTest() {
        this.logger.debug('Accessibility after test hook. Before sending test stop event')

        try {

            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
            const testInstance: TestFrameworkInstance = TestFramework.getTrackedInstance()
            const sessionId = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)

            if (!autoInstance || !testInstance) {
                this.logger.error('No tracked instances found for accessibility after test')
                return
            }

            // Get test metadata that was stored in onBeforeTest
            const testIdentifier = testInstance.getContext().getId()
            const testMetadata = testInstance.getData(`accessibility_metadata_${testIdentifier}`)

            if (!testMetadata) {
                this.logger.debug('No accessibility metadata found for this test')
                return
            }

            const { accessibilityScanStarted, scanTestForAccessibility } = testMetadata
            if (!accessibilityScanStarted) {
                this.logger.debug('Accessibility scan was not started for this test')
                return
            }

            if (scanTestForAccessibility) {
                this.logger.info('Automate test case execution has ended. Processing for accessibility testing is underway.')

                // Get the driver for sending test stop event
                const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser

                if (browser) {
                    let dataForExtension = {
                        'thTestRunUuid': process.env.TEST_ANALYTICS_ID,
                        'thBuildUuid': process.env.BROWSERSTACK_TESTHUB_UUID,
                        'thJwtToken': process.env.BROWSERSTACK_TESTHUB_JWT
                    }
                    const driverExecuteParams = await this.getDriverExecuteParams()
                    dataForExtension = { ...dataForExtension, ...driverExecuteParams }

                    // final scan and saving the results
                    await this.sendTestStopEvent(browser, dataForExtension)
                    this.logger.info('Accessibility testing for this test case has ended.')
                } else {
                    this.logger.warn('No driver found to send accessibility test stop event')
                }
                this.accessibilityMap.delete(sessionId)

                // Clean up test metadata
                TestFramework.setState(testInstance, `accessibility_metadata_${testIdentifier}`, null)
            }

        } catch (error) {
            this.logger.error(`Accessibility results could not be processed for the test case. Error: ${error}`)
        }
    }

    private shouldPatchExecuteScript(script: string | null): boolean {
        if (!script || typeof script !== 'string') {
            return true
        }

        return (
            script.toLowerCase().indexOf('browserstack_executor') !== -1 ||
            script.toLowerCase().indexOf('browserstack_accessibility_automation_script') !== -1
        )
    }

    private getCapability(capabilities: WebdriverIO.Capabilities, key: string, legacyKey = '') {

        if (key === 'deviceName') {
            if ((capabilities as WebdriverIO.Capabilities)['bstack:options'] && (capabilities as WebdriverIO.Capabilities)['bstack:options']?.deviceName) {
                return (capabilities as WebdriverIO.Capabilities)['bstack:options']?.deviceName
            } else if ((capabilities as WebdriverIO.Capabilities)['bstack:options'] && (capabilities as WebdriverIO.Capabilities)['bstack:options']?.device) {
                return (capabilities as WebdriverIO.Capabilities)['bstack:options']?.device
            } else if ((capabilities as WebdriverIO.Capabilities)['appium:deviceName']) {
                return (capabilities as WebdriverIO.Capabilities)['appium:deviceName']
            }
        } else if (key === 'goog:chromeOptions' && (capabilities as WebdriverIO.Capabilities)['goog:chromeOptions']) {
            return (capabilities as WebdriverIO.Capabilities)['goog:chromeOptions']
        } else {
            const bstackOptions = (capabilities as WebdriverIO.Capabilities)['bstack:options']
            if (bstackOptions && bstackOptions?.[key as keyof Capabilities.BrowserStackCapabilities]) {
                return bstackOptions?.[key as keyof Capabilities.BrowserStackCapabilities]
            } else if ((capabilities as WebdriverIO.Capabilities)[legacyKey as keyof WebdriverIO.Capabilities]) {
                return (capabilities as WebdriverIO.Capabilities)[legacyKey as keyof WebdriverIO.Capabilities]
            }
        }

    }

    private async performScanCli(
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
        commandName?: string
    ): Promise<{ [key: string]: any; } | undefined> {
        return await PerformanceTester.measureWrapper(
            PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.PERFORM_SCAN,
            async () => {
                try {
                    if (!this.accessibility) {
                        this.logger.debug('Not an Accessibility Automation session.')
                        return
                    }
                    if (this.isAppAccessibility) {
                        const results: unknown = await (browser as WebdriverIO.Browser).execute(
                            formatString(this.scriptInstance.performScan, JSON.stringify(_getParamsForAppAccessibility(commandName))) as string,
                            {}
                        )
                        BStackLogger.debug(util.format(results as string))
                        return (results as { [key: string]: any; } | undefined)
                    }
                    const results = await (browser as WebdriverIO.Browser).executeAsync(
                        this.scriptInstance.performScan as string,
                        { 'method': commandName || '' }
                    )
                    return (results as { [key: string]: any; } | undefined)
                } catch (err: any) {
                    this.logger.error('Accessibility Scan could not be performed : ' + err)
                    return
                }
            },
            { command: commandName }
        )()
    }

    private async sendTestStopEvent(browser: WebdriverIO.Browser, dataForExtension: any) {
        try {
            if (!this.accessibility) {
                this.logger.debug('Not an Accessibility Automation session.')
                return
            }

            this.logger.debug('Performing scan before saving results')
            await this.performScanCli(browser)

            if (this.isAppAccessibility) {
                return
            }

            await PerformanceTester.measureWrapper(PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.SAVE_RESULTS, async () => {
                const results: unknown = await (browser as WebdriverIO.Browser).executeAsync(accessibilityScripts.saveTestResults as string, dataForExtension)
                this.logger.debug(`save results : ${util.format(results as string)}`)
            })()
        } catch (error) {
            this.logger.error(`Error while sending test stop event: ${error}`)
        }
    }

    async getA11yResults(browser: WebdriverIO.Browser): Promise<Array<{ [key: string]: any; }>> {
        return await PerformanceTester.measureWrapper(
            PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.GET_RESULTS,
            async () => {
                try {
                    if (!this.accessibility) {
                        this.logger.debug('Not an Accessibility Automation session.')
                        return
                    }
                    this.logger.debug('Performing scan before getting results')
                    await this.performScanCli(browser)
                    const results: Array<{ [key: string]: any; }> = await (browser as WebdriverIO.Browser).executeAsync(this.scriptInstance.getResults as string)
                    return results
                } catch (error: any) {
                    this.logger.error('No accessibility results were found.')
                    this.logger.debug(`getA11yResults Failed. Error: ${error}`)
                    return []
                }
            }
        )()
    }

    async getA11yResultsSummary(browser: WebdriverIO.Browser): Promise<{ [key: string]: any; }> {
        return await PerformanceTester.measureWrapper(
            PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.GET_RESULTS_SUMMARY,
            async () => {
                try {
                    if (!this.accessibility) {
                        this.logger.debug('Not an Accessibility Automation session.')
                        return
                    }
                    this.logger.debug('Performing scan before getting results summary')
                    await this.performScanCli(browser)
                    const summaryResults: { [key: string]: any; } = await (browser as WebdriverIO.Browser).executeAsync(this.scriptInstance.getResultsSummary as string)
                    return summaryResults
                } catch {
                    this.logger.error('No accessibility summary was found.')
                    return {}
                }
            }
        )()
    }

    async getDriverExecuteParams() {
        const payload: Omit<FetchDriverExecuteParamsEventRequest, 'binSessionId'> = {
            product: 'accessibility',
            scriptName: 'saveResults'
        }
        const response: FetchDriverExecuteParamsEventResponse = await GrpcClient.getInstance().fetchDriverExecuteParamsEvent(payload)
        if (response.success) {
            return response.accessibilityExecuteParams ? JSON.parse(Buffer.from(response.accessibilityExecuteParams).toString('utf8')) : {}
        }
        this.logger.error(`Failed to fetch driver execute params: ${response.error || 'Unknown error'}`)
        return {}
    }

}
