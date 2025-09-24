import util from 'node:util'
import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import { HookState } from '../states/hookState.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import { AutomationFrameworkConstants } from '../frameworks/constants/automationFrameworkConstants.js'
import { isBrowserstackSession } from '../../util.js'
import type { DriverInitRequest, DriverInitResponse } from '@browserstack/wdio-browserstack-service'
import { GrpcClient } from '../grpcClient.js'

export default class WebdriverIOModule extends BaseModule {
    name: string
    browserName: string | null
    browserVersion: string | null
    platforms: Array<string>
    testRunId: string | null

    logger = BStackLogger
    static MODULE_NAME = 'WebdriverIOModule'

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
            AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_INPUT_CAPABILITIES, capabilities)

            await this.getBinDriverCapabilities(instance, capabilities)
        } catch (e){
            this.logger.error(`Error in onBeforeDriverCreate: ${util.format(e)}`)
        }
    }

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
            // Cast hubUrl to TrackedData - it should be a string
            const hubUrl = typeof args.hubUrl === 'string' ? args.hubUrl as string : null
            AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_HUB_URL, hubUrl)

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

            this.logger.info(`onDriverCreated: Successfully processed driver creation for session: ${sessionId}`)
        } catch (error) {
            this.logger.error(`onDriverCreated: Error processing driver creation: ${error}`)
        }
    }

    async getBinDriverCapabilities(instance: AutomationFrameworkInstance, caps: WebdriverIO.Capabilities) {
        try {
            const payload: Omit<DriverInitRequest, 'binSessionId'> = {
                platformIndex: process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0,
                ref: instance.getRef(),
                userInputParams: Buffer.from(JSON.stringify(caps).toString())
            }

            const response: DriverInitResponse = await GrpcClient.getInstance().driverInitEvent(payload)
            if (response.success) {
                if (response.capabilities.length > 0) {
                    const capabilitiesStr = (response.capabilities as Buffer).toString('utf8')
                    const capabilitiesObj = JSON.parse(capabilitiesStr)
                    AutomationFramework.setState(instance, AutomationFrameworkConstants.KEY_CAPABILITIES, capabilitiesObj)
                }
                this.logger.debug(`getBinDriverCapabilities: got hub url ${response.hubUrl}`)
            }
        } catch (error) {
            this.logger.error(`getBinDriverCapabilities: Error getting capabilities: ${error}`)
        }
    }
}
