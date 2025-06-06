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
import type { Browser } from 'webdriverio'
import { shouldScanTestForAccessibility } from '../../util.js'
import { CLIUtils } from '../cliUtils.js'

export default class AcessibilityModule extends BaseModule {

    logger = BStackLogger
    name: string
    scriptInstance: typeof accessibilityScripts
    isEnabled: boolean = false
    isAppAccessibility: boolean
    accessibilityConfig: unknown
    static MODULE_NAME = 'AcessibilityModule'
    accessibility: Map<number, boolean>
    LOG_DISABLED_SHOWN: Map<number, boolean>
    TEST_INIT: string = 'test_init'
    DRIVER_INIT: string = 'driver_init'

    constructor(accessibilityConfig: unknown) {
        super()
        this.name = 'AcessibilityModule'
        this.accessibilityConfig = accessibilityConfig //accessibilityresponse 

        AutomationFramework.registerObserver(AutomationFrameworkState.EXECUTE, HookState.PRE, this.onBeforeExecute.bind(this))
        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.POST, this.onBeforeTest.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.PRE, this.onBeforeTest.bind(this))
        AutomationFramework.registerObserver(AutomationFrameworkState.QUIT, HookState.PRE, this.onAfterTest.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))
        this.isEnabled = true
        this.scriptInstance = accessibilityScripts
        this.accessibility = new Map()
        this.LOG_DISABLED_SHOWN = new Map()
        this.isAppAccessibility = false

    }

    onBeforeExecute(args: any){
        

        // platform validation
        // command wrapping
        // performscan

        //wdio-specific
    }

    onBeforeTest(args: any) {
        try {
            const suiteTitle = args.suiteTitle || ''
            const test = args.test || {}
    
            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
            const testInstance: TestFrameworkInstance = TestFramework.getTrackedInstance()
            
            let driver: Browser = AutomationFramework.getState(
                autoInstance,
                AutomationFramework.KEY_AUTOMATION_SESSIONS,
            ) as Browser
            
            if (driver === null) {
                driver = AutomationFramework.getState(autoInstance, AutomationFramework.KEY_NON_BROWSERSTACK_AUTOMATION_SESSIONS)
            }
            
            if (driver === null) {
                testInstance.updateData(this.TEST_INIT, true)
            }
            
            if (testInstance.getData(this.DRIVER_INIT) === false && testInstance.getData(this.TEST_INIT) === false) {
                testInstance.updateData(this.DRIVER_INIT, true)
            }
            
            testInstance.updateData(this.TEST_INIT, true)
            
            const accessibilityOptions = this.config.accessibilityOptions           
            const shouldScanTest = shouldScanTestForAccessibility(suiteTitle, test.title, accessibilityOptions as { [key: string]: any } | undefined)
            
            // Create test metadata similar to accessibility-handler
            const testIdentifier = testInstance.getContext().getThreadId()
            const testMetadata = {
                scanTestForAccessibility: shouldScanTest,
                accessibilityScanStarted: true
            }
            
            // Store test metadata in test instance
            testInstance.updateData(`accessibility_metadata_${testIdentifier}`, testMetadata)
            this.accessibility.set(testIdentifier, shouldScanTest)
            
            // Log if accessibility scan is enabled for this test
            if (shouldScanTest) {
                this.logger.info('Accessibility test case execution has started.')
            } else if (!this.LOG_DISABLED_SHOWN.get(testIdentifier)) {
                this.logger.info('Accessibility scanning disabled for this test case.')
                this.LOG_DISABLED_SHOWN.set(testIdentifier, true)
            }
            
            // Set global accessibility variable (similar to Listener.setTestRunAccessibilityVar)
            testInstance.updateData('accessibility_scan_enabled', this.isEnabled && shouldScanTest)
            
        } catch (error) {
            this.logger.error(`Exception in starting accessibility automation scan for this test case: ${error}`)
        }
    }
    

    async onAfterTest(args: any) {
        this.logger.debug('Accessibility after test hook. Before sending test stop event')
        
        try {
            const suiteTitle = args.suiteTitle || ''
            const test = args.test || {}
            
            const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
            const testInstance: TestFrameworkInstance = TestFramework.getTrackedInstance()
            
            if (!autoInstance || !testInstance) {
                this.logger.error('No tracked instances found for accessibility after test')
                return
            }
            
            // Get test metadata that was stored in onBeforeTest
            const testIdentifier = testInstance.getContext().getThreadId()
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
                let driver: Browser = AutomationFramework.getState(
                    autoInstance,
                    AutomationFramework.KEY_AUTOMATION_SESSIONS,
                ) as Browser
                
                if (driver === null) {
                    driver = AutomationFramework.getState(autoInstance, AutomationFramework.KEY_NON_BROWSERSTACK_AUTOMATION_SESSIONS)
                }
                
                if (driver) {
                    const dataForExtension = {
                        'thTestRunUuid': process.env.TEST_ANALYTICS_ID,
                        'thBuildUuid': process.env.BROWSERSTACK_TESTHUB_UUID,
                        'thJwtToken': process.env.BROWSERSTACK_TESTHUB_JWT
                    }
                    
                    // Send test stop event
                    await this.sendTestStopEvent(driver, dataForExtension)
                    
                    this.logger.info('Accessibility testing for this test case has ended.')
                } else {
                    this.logger.warn('No driver found to send accessibility test stop event')
                }
                this.accessibility.delete(testIdentifier)
                
                // Clean up test metadata
                testInstance.updateData(`accessibility_metadata_${testIdentifier}`, null)
            }
            
        } catch (error) {
            this.logger.error(`Accessibility results could not be processed for the test case ${test?.title || 'unknown'}. Error: ${error}`)
        }
    }
    
}
