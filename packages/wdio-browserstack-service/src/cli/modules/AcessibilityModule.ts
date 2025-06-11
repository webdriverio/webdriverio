import BaseModule from './BaseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import type TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import { HookState } from '../states/hookState.js'
import accessibilityScripts from '../../scripts/accessibility-scripts.js'
import { shouldScanTestForAccessibility, validateCapsWithA11y } from '../../util.js'
import { AutomationFrameworkConstants } from '../frameworks/constants/automationFrameworkConstants.js'
import util from 'node:util'

export default class AcessibilityModule extends BaseModule {

    logger = BStackLogger
    name: string
    scriptInstance: typeof accessibilityScripts
    accessibility: boolean = false
    isAppAccessibility: boolean
    accessibilityConfig: unknown
    static MODULE_NAME = 'AcessibilityModule'
    accessibilityMap: Map<number, boolean>
    LOG_DISABLED_SHOWN: Map<number, boolean>

    constructor(accessibilityConfig: unknown) {
        super()
        this.name = 'AcessibilityModule'
        this.accessibilityConfig = accessibilityConfig //accessibilityResponse
        // AutomationFramework.registerObserver(AutomationFrameworkState.EXECUTE, HookState.PRE, this.onBeforeExecute.bind(this))
        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.POST, this.onBeforeExecute.bind(this))
        TestFramework.registerObserver(TestFrameworkState.INIT_TEST, HookState.PRE, this.onBeforeTest.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))
        this.accessibility = true
        this.scriptInstance = accessibilityScripts
        this.accessibilityMap = new Map()
        this.LOG_DISABLED_SHOWN = new Map()
        this.isAppAccessibility = false
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

            const browserCaps = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_CAPABILITIES)
            const inputCaps = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_INPUT_CAPABILITIES)
            const platformA11yMeta = {
                browser_name: browserCaps.browserName,
                browser_version: browserCaps?.browserVersion || 'latest',
                platform_name: browserCaps?.platformName,
            }
            const device = this.getCapability(inputCaps, 'deviceName')
            const chromeOptions = this.getCapability(inputCaps, 'goog:chromeOptions')
            this.accessibility = validateCapsWithA11y(device, platformA11yMeta, chromeOptions)

            if (!this.accessibility) {
                this.logger.info('Accessibility automation is disabled for this session.')
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

            //patching of result summary
            browser.getAccessibilityResultsSummary = async () => {
                return await this.getA11yResultsSummary(browser)
            }

            browser.getAccessibilityResults = async () => {
                return await this.getA11yResults(browser)
            }

        } catch (error) {
            this.logger.error(`Error in onBeforeExecute: ${error}`)
        }
    }

    private async commandWrapper(command: any, originFunction: Function, ...args: any[]) {
        try {
            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
            const sessionId =  AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)
            // Check if accessibility is still enabled for this session
            if (!sessionId || !this.accessibilityMap.get(sessionId)) {
                return await originFunction(...args)
            }

            const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser

            // Perform accessibility scan before command if script is available
            if (
                !command.name.includes('execute') ||
                    !this.shouldPatchExecuteScript(args.length ? args[0] : null)
            )  {
                try {
                    await this.performScanCli(browser, command.name)
                    this.logger.debug(`Accessibility scan performed after ${command.name} command`)
                } catch (scanError) {
                    this.logger.debug(`Error performing accessibility scan after ${command.name}: ${scanError}`)
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

            const sessionId =  AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)
            const accessibilityOptions = this.config.accessibilityOptions
            const shouldScanTest = shouldScanTestForAccessibility(suiteTitle, test.title, accessibilityOptions as { [key: string]: any } | undefined) &&  this.accessibility

            // Create test metadata similar to accessibility-handler
            const testIdentifier = testInstance.getContext().getId()
            const testMetadata = {
                scanTestForAccessibility: shouldScanTest,
                accessibilityScanStarted: true
            }

            // Store test metadata in test instance
            testInstance.updateData(`accessibility_metadata_${testIdentifier}`, testMetadata)
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
            const sessionId =  AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)

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
                    const dataForExtension = {
                        'thTestRunUuid': process.env.TEST_ANALYTICS_ID,
                        'thBuildUuid': process.env.BROWSERSTACK_TESTHUB_UUID,
                        'thJwtToken': process.env.BROWSERSTACK_TESTHUB_JWT
                    }

                    // final scan and saving the results
                    await this. sendTestStopEvent(browser, dataForExtension)
                    this.logger.info('Accessibility testing for this test case has ended.')
                } else {
                    this.logger.warn('No driver found to send accessibility test stop event')
                }
                this.accessibilityMap.delete(sessionId)

                // Clean up test metadata
                testInstance.updateData(`accessibility_metadata_${testIdentifier}`, null)
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

    private getCapability(capabilities: WebdriverIO.Capabilities, key: string): string | object | undefined {

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
        }

    }

    private async performScanCli(browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, commandName?: string){
        try {
            const results = await (browser as WebdriverIO.Browser).executeAsync(this.scriptInstance.performScan as string, { 'method': commandName || '' })
            return (results as { [key: string]: any; } | undefined)
        } catch (err : any) {
            this.logger.error('Accessibility Scan could not be performed : ' + err)
            return
        }
    }

    private async sendTestStopEvent(browser: WebdriverIO.Browser, dataForExtension: any){
        try {
            this.logger.debug('Sending test stop event for accessibility results')
            await this.performScanCli(browser, 'afterTest')
            const results: unknown = await (browser as WebdriverIO.Browser).executeAsync(this.scriptInstance.saveTestResults as string, dataForExtension)
            this.logger.debug(`save results : ${util.format(results as string)}`)
        } catch (error) {
            this.logger.error(`Error while sending test stop event: ${error}`)
        }
    }

    async getA11yResults(browser: WebdriverIO.Browser){
        try {
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
    async getA11yResultsSummary(browser: WebdriverIO.Browser){
        try {
            this.logger.debug('Performing scan before getting results summary')
            await this.performScanCli(browser)
            const summaryResults: { [key: string]: any; } = await (browser as WebdriverIO.Browser).executeAsync(this.scriptInstance.getResultsSummary as string)
            return summaryResults
        } catch {
            this.logger.error('No accessibility summary was found.')
            return {}
        }
    }
}
