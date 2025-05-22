import AutomationFramework from './automationFramework.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import { CLIUtils } from '../cliUtils.js'
import TrackedInstance from '../instances/trackedInstance.js'
import AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import { BStackLogger as logger } from '../cliLogger.js'

/**
 * WebdriverIO Framework class
 */
export default class WdioAutomationFramework extends AutomationFramework {

    constructor(automationFrameworkName: string, automationFrameworkVersion: string) {
        super(automationFrameworkName, automationFrameworkVersion)
    }

    /**
     * Find instance and track any state for the automation framework
     * @param {*} automationFrameworkState
     * @param {*} hookState
     * @param {*} args
     */
    async trackEvent(automationFrameworkState: State, hookState: State, args: unknown = {}) {
        logger.info(`trackEvent: automationFrameworkState=${automationFrameworkState} hookState=${hookState}`)
        await super.trackEvent(automationFrameworkState, hookState, args)

        const instance = this.resolveInstance(automationFrameworkState, hookState, args)
        if (instance === null) {
            logger.error(`trackEvent: instance not found for automationFrameworkState=${automationFrameworkState} hookState=${hookState}`)
            return
        }
        // args.instance = instance
        await this.runHooks(instance, automationFrameworkState, hookState, args)
    }

    /**
     * Resolve instance for the automation framework
     * @param {*} automationFrameworkState
     * @param {*} hookState
     * @param {*} args
     * @returns instance
     */
    resolveInstance(automationFrameworkState: State, hookState: State, args: unknown = {}) {
        let instance = null
        logger.info(`resolveInstance: resolving instance for automationFrameworkState=${automationFrameworkState} hookState=${hookState}`)
        if (automationFrameworkState === AutomationFrameworkState.CREATE || automationFrameworkState === AutomationFrameworkState.NONE) {
            this.trackWebdriverIOInstance(automationFrameworkState, args)
        }

        instance = AutomationFramework.getTrackedInstance()
        return instance
    }

    /**
     * Create instance for WebdriverIO
     * @returns {void}
     */
    trackWebdriverIOInstance(automationFrameworkState: State, args: unknown = {}) {
        if (
            // !args.browser &&
            AutomationFramework.getTrackedInstance()
        ) {
            logger.info('trackWebdriverIOInstance: instance already exists')
            return
        }

        const target = CLIUtils.getCurrentInstanceName()
        const trackedContext = TrackedInstance.createContext(target)
        let instance = null
        logger.info(`trackWebdriverIOInstance: created instance for target=${target}, state=${automationFrameworkState}, args=${args}`)

        instance = new AutomationFrameworkInstance(
            trackedContext,
            this.getAutomationFrameworkName(),
            this.getAutomationFrameworkVersion(),
            automationFrameworkState
        )

        AutomationFramework.setTrackedInstance(trackedContext, instance)
        logger.info(`trackWebdriverIOInstance: saved instance contextId=${trackedContext.getId()} target=${target}`)
    }
}
