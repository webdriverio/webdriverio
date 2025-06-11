import util from 'node:util'
import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import { HookState } from '../states/hookState.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import { AutomationFrameworkConstants } from '../frameworks/constants/automationFrameworkConstants.js'
import { isBrowserstackSession } from '../../util.js'
import type { DriverInitRequest, DriverInitResponse } from 'src/proto/sdk-messages.js'
import { GrpcClient } from '../grpcClient.js'

export default class WebdriverIOModule extends BaseModule {
    name: string
    browserName: string | null
    browserVersion: string | null
    platforms: Array<string>
    testRunId: string | null

    logger = BStackLogger
    static MODULE_NAME = 'WebdriverIOModule'
    static KEY_BROWSER_OBJECT = 'browserObject'
    static KEY_CONTEXT_OBJECT = 'contextObject'
    static KEY_PAGE_OBJECT = 'pageObject'
    static KEY_SESSION_ID = 'sessionId'
    static KEY_PLATFORM_INDEX = 'platformIndex'
    static KEY_CAPABILITIES = 'capabilities'
    static KEY_HUB_URL = 'hubUrl'
    static KEY_PLATFORM_DETAILS = 'platformDetails'
    static KEY_TEST_ID = 'testId'

    /**
       * Create a new WebdriverIOModule
       */
    constructor() {
        super()
        this.name = 'WebdriverIOModule'
        this.browserName = null
        this.browserVersion = null
        this.platforms = []
        this.testRunId = null

        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.PRE, this.onBeforeDriverCreate.bind(this))
        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.POST, this.onDriverCreated.bind(this))
        AutomationFramework.registerObserver(AutomationFrameworkState.EXECUTE, HookState.POST, this.onAfterTest.bind(this))
    }

    /**
       * Get the module name
       * @returns {string} The module name
       */
    getModuleName() {
        return WebdriverIOModule.MODULE_NAME
    }

    async onBeforeDriverCreate(args: Record<string, unknown>) {
        try {
            const instance = args.instance as AutomationFrameworkInstance
            this.logger.debug('onBeforeDriverCreate: driver is about to be created')
            const capabilities = args.caps as WebdriverIO.Capabilities
            if (!capabilities) {
                this.logger.warn('onBeforeDriverCreate: No capabilities provided')
                return
            }
            // const hubUrl = args.hubUrl
            await this.getBinDriverCapabilities(instance, capabilities)
            // AutomationFramework.setState(instance, WebdriverIOModule.KEY_CAPABILITIES, capabilities)
            // AutomationFramework.setState(instance, WebdriverIOModule.KEY_HUB_URL, hubUrl)
        } catch (e){
            this.logger.error(`Error in onBeforeDriverCreate: ${util.format(e)}`)
        }
    }

    /**
       * Handle Playwright dispatch events
       * @param {Object} args - The arguments containing the Playwright dispatch event message
       * @returns {void}
       */
    // async onPlaywrightDispatch(args) {
    //     try {
    //         const bsParams = args?.message && args?.message?.params && args?.message?.params?.bsParams
    //         const bStackParams = args?.message && args?.message?.bStackParams
    //         if (bsParams || bStackParams) {
    //             this.logger.debug(`onDispatchExecute: Playwright driver is executing tests ${util.inspect(bsParams)} || ${util.inspect(bStackParams)}`)
    //             const instance = args?.instance
    //             const sessionId = bsParams?.sessionId || bStackParams?.sessionId
    //             const platformDetails = bsParams?.platformDetails || bStackParams?.platformDetails
    //             if (sessionId) {
    //                 this.logger.debug(`onDispatchExecute: Playwright sessionId: ${sessionId}`)
    //                 AutomationFramework.setState(instance, PlaywrightDriverModule.KEY_SESSION_ID, sessionId)
    //             }
    //             if (platformDetails) {
    //                 this.logger.debug(`onDispatchExecute: Playwright platform details: ${util.inspect(platformDetails)}`)
    //                 AutomationFramework.setState(instance, PlaywrightDriverModule.KEY_PLATFORM_INDEX, platformDetails)
    //             }
    //         }
    //     } catch (e) {
    //         this.logger.error(`Error in onDispatchExecute: ${util.format(e)}`)
    //     }
    // }

    /**
     * Handle driver creation event
     * @param args Event arguments containing driver and instance information
     */
    async onDriverCreated(args: Record<string, unknown>): Promise<void> {
        this.logger.debug('onDriverCreated: Called')

        try {
            const instance = args.instance as AutomationFrameworkInstance
            const browser = args.browser as WebdriverIO.Browser

            if (!instance || !browser) {
                this.logger.warn('onDriverCreated: Missing instance or driver')
                return
            }
            AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_HUB_URL, args.hubUrl)

            // Get session ID from driver
            let sessionId: string | null = null
            try {
                sessionId = browser.sessionId
                if (sessionId) {
                    this.logger.debug(`onDriverCreated: Driver session ID: ${sessionId}`)
                    AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID, sessionId)
                }
            } catch (error) {
                this.logger.debug(`onDriverCreated: Could not get session ID: ${error}`)
            }

            // Get capabilities from driver
            try {
                const capabilities = browser.capabilities as WebdriverIO.Capabilities
                if (capabilities) {
                    this.logger.debug(`onDriverCreated: Driver capabilities: ${JSON.stringify(capabilities)}`)

                    AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_CAPABILITIES, capabilities)
                }
            } catch (error) {
                this.logger.debug(`onDriverCreated: Could not get capabilities: ${error}`)
            }

            // Check if this is a BrowserStack hub
            try {
                const isBrowserStackHub = isBrowserstackSession(browser)
                AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB, isBrowserStackHub)
                this.logger.debug(`onDriverCreated: Is BrowserStack hub: ${isBrowserStackHub}`)
            } catch (error) {
                this.logger.debug(`onDriverCreated: Could not determine hub type: ${error}`)
            }
            AutomationFramework.setDriver(instance, browser)

            // // Set driver creation timestamp
            // AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_DRIVER_CREATED_AT, new Date().toISOString())

            // Store driver reference if needed
            // AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_DRIVER_INSTANCE, driver)

            this.logger.info(`onDriverCreated: Successfully processed driver creation for session: ${sessionId}`)
            const autoInstace = AutomationFramework.getTrackedInstance() as AutomationFrameworkInstance
            this.logger.info(`onDriverCreated: Automation instance: ${JSON.stringify(Object.fromEntries(autoInstace.getAllData()))}`)

        } catch (error) {
            this.logger.error(`onDriverCreated: Error processing driver creation: ${error}`)
        }
    }

    async getBinDriverCapabilities(instance: AutomationFrameworkInstance, caps: WebdriverIO.Capabilities) {
        try {
            const payload: DriverInitRequest = {
                platformIndex: process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0,
                ref: instance.getRef(),
                userInputParams: Buffer.from(JSON.stringify(caps).toString()),
                binSessionId: ''
            }

            const response: DriverInitResponse = await GrpcClient.getInstance().driverInitEvent(payload)
            if (response.success) {
                if (response.capabilities.length > 0) {
                    this.logger.debug(`getBinDriverCapabilities: Received capabilities from driver: ${JSON.stringify(response.capabilities)}`)
                }
                this.logger.debug(`getBinDriverCapabilities: got hub url ${response.hubUrl}`)
            }
            const capabilitiesStr = (response.capabilities as Buffer).toString('utf8')
            const capabilitiesObj = JSON.parse(capabilitiesStr)
            if (capabilitiesObj['bstack:options'] && 'buildTag' in capabilitiesObj['bstack:options']) {
                delete capabilitiesObj['bstack:options'].buildTag
            }
            if ('browserstack.buildTag' in capabilitiesObj) {
                delete capabilitiesObj['browserstack.buildTag']
            }
            AutomationFramework.setState(instance, WebdriverIOModule.KEY_CAPABILITIES, capabilitiesObj)
        } catch (error) {
            this.logger.error(`getBinDriverCapabilities: Error getting capabilities: ${error}`)
        }
    }

    // /**
    //    * Store playwright page,context and browser objects
    //    * @param {Object} args - The arguments containtaing page or context or browser objects
    //    * @returns {void}
    //    */
    // async onAfterDriverCreate(args) {
    //     try {
    //         this.logger.debug('onAfterDriverCreate: Playwright driver is about to be created')
    //         const instance = args.instance
    //         this.playwrightVersion = getFrameworkVersion(FRAMEWORKS.PLAYWRIGHT)

    //         if (args.page) {
    //             this.logger.debug('onAfterDriverCreate: Setting page object')
    //             AutomationFramework.setState(instance, WebdriverIOModule.KEY_PAGE_OBJECT, args.page)
    //             if (args.testInfo) {
    //                 this.logger.debug('onAfterDriverCreate: Setting Session Name from testInfo')
    //                 const testId = args.testInfo?._test?.id || args.testInfo?.testId
    //                 AutomationFramework.setState(instance, WebdriverIOModule.KEY_TEST_ID, testId)
    //                 // await this.markSessionName(args.testInfo)
    //             }

    //         }

    //         if (args.context) {
    //             this.logger.debug('onAfterDriverCreate: Setting context object')
    //             AutomationFramework.setState(instance, WebdriverIOModule.KEY_CONTEXT_OBJECT, args.context)
    //         }

    //         if (args.browser) {
    //             this.logger.debug('onAfterDriverCreate: Setting browser object')
    //             const platformIndex = global.__workerDetails.workerInfo.parallelIndex
    //             AutomationFramework.setState(instance, WebdriverIOModule.KEY_BROWSER_OBJECT, args.browser)
    //             AutomationFramework.setState(instance, WebdriverIOModule.KEY_PLATFORM_INDEX, platformIndex)
    //             const userInputParams = Buffer.from(JSON.stringify({ 'isPlaywright': true }).toString('base64'))
    //             const response = await GrpcClient.getInstance().driverInit({ platformIndex, ref: instance.getRef(), userInputParams })
    //         }
    //     } catch (e) {
    //         this.logger.error(`Error in onAfterDriverCreate: ${util.format(e)}`)
    //     }
    // }

    async onAfterTest(args: Record<string, unknown>) {
        this.logger.debug('Automation onAfterTest: Test completed')
        const instance = args.instance
        if (!instance) {
            this.logger.debug('Automation onAfterTest: Automation instance is not available')

            return
        }
        // const testInfo = args.testInfo
        // const testId = testInfo.id
        // const result = testInfo.status
        // const sanitisedStatus = getPlaywrightStatus(result)
        // const sessionName = getPlaywrightSessionName(testInfo)
        // const reason = nestedKeyValue(result, ['error', 'message'])
        // this.logger.debug(`Automation onAfterTest: Test status: ${sanitisedStatus}`)

        // if (!sanitisedStatus) {
        //     this.logger.debug('Unable to mark session status, received status: ', result.status)

        //     return
        // }

        // this.logger.debug(`Automation onAfterTest: Setting session status for testId: ${testId}`)

        // Set session status
        // await this.markSessionStatus(instance, sessionName, sanitisedStatus, reason)
    }
}
