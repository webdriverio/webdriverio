import { BStackLogger as logger } from '../cliLogger.js'
import { eventDispatcher } from '../eventDispatcher.js'
import { CLIUtils } from '../cliUtils.js'
import TrackedInstance from '../instances/trackedInstance.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import type TrackedContext from '../instances/trackedContext.js'
import { AutomationFrameworkConstants } from './constants/automationFrameworkConstants.js'
import type { TrackedData } from '../../types.js'

/**
 * AutomationFramework - Automation Framework abstract class
 */
export default class AutomationFramework {
    #automationFrameworkName: string
    #automationFrameworkVersion: string

    static instances = new Map()
    static KEY_AUTOMATION_SESSIONS = 'automation_sessions'
    static KEY_NON_BROWSERSTACK_AUTOMATION_SESSIONS = 'non_browserstack_automation_sessions'

    /**
   * Constructor for the AutomationFramework
   * @param {string} automationFrameworkName - Name of the automation framework
   * @param {string} automationFrameworkVersion - Version of the automation framework
  */
    constructor(automationFrameworkName: string, automationFrameworkVersion: string) {
        this.#automationFrameworkName = automationFrameworkName
        this.#automationFrameworkVersion = automationFrameworkVersion
    }

    /**
   * Get the automation framework name
   * @returns {string} The name of the automation framework
   */
    getAutomationFrameworkName() {
        return this.#automationFrameworkName
    }

    /**
   * Get the automation framework version
   * @returns {string} The version of the automation framework
   */
    getAutomationFrameworkVersion() {
        return this.#automationFrameworkVersion
    }

    /**
   * Track an event
   * @param {Object}
   * @param {Object}
   * @param {Object}
   * @returns {void}
   */
    async trackEvent(automationFrameworkState: State, hookState: State, args: unknown = {}) {
        logger.info(`trackEvent: automationFrameworkState=${automationFrameworkState} hookState=${hookState} args=${args}`)
    }

    /**
   *
   * @param {*} instance
   * @param {*} automationFrameworkState
   * @param {*} hookState
   * @param {*} args
   */
    async runHooks(instance: AutomationFrameworkInstance, automationFrameworkState: State, hookState: State, args: unknown = {}) {
        logger.info(`runHooks: automationFrameworkState=${automationFrameworkState} hookState=${hookState}`)

        const hookRegistryKey = CLIUtils.getHookRegistryKey(automationFrameworkState, hookState)
        await eventDispatcher.notifyObserver(hookRegistryKey, args)
    }

    /**
   * Register an observer
   * @returns {void}
   */
    static registerObserver(automationFrameworkState: State, hookState: State, callback: Function) {
        eventDispatcher.registerObserver(CLIUtils.getHookRegistryKey(automationFrameworkState, hookState), callback)
    }

    /**
   * Set the tracked instance
   * @param {TrackedInstance} context - The context
   * @param {TrackedInstance} instance - The instance
   * @returns {void}
   */
    static setTrackedInstance(context: TrackedContext, instance: AutomationFrameworkInstance) {
        logger.debug(`setTrackedInstance: ${context.getId()}`)
        AutomationFramework.instances.set(context.getId(), instance)
    }

    /**
   * Get the tracked instance
   * @returns {TrackedInstance} The tracked instance
   */
    static getTrackedInstance() {
        logger.debug(`getTrackedInstance: ${CLIUtils.getCurrentInstanceName()}`)
        const context = TrackedInstance.createContext(CLIUtils.getCurrentInstanceName())
        return AutomationFramework.instances.get(context.getId())
    }

    /**
   * Set the state
   * @param {TrackedInstance} instance - The instance
   * @param {string} key - The key
   * @param {*} value - The value
   * @returns
   */
    static setState(instance: AutomationFrameworkInstance, key: string, value: TrackedData) {
        instance.getAllData().set(key, value)
    }

    /**
   * Get the state
   * @param {TrackedInstance} instance - The instance
   * @param {string} key - The key
   * @returns {*} The state
   */
    static getState(instance: AutomationFrameworkInstance, key: string) {
        return instance.getAllData().get(key)
    }

    static isAutomationSession(instance: AutomationFrameworkInstance): boolean {
        const value = AutomationFramework.getState(instance, AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB)
        return Boolean(value)
    }

    /**
     * Set the driver for the automation framework instance
     * @param {AutomationFrameworkInstance} instance - The automation framework instance
     * @param {*} driver - The driver object
     */
    static setDriver(instance: AutomationFrameworkInstance, driver: TrackedData): void {
        if (this.isAutomationSession(instance)) {
            AutomationFramework.setState(instance, AutomationFramework.KEY_AUTOMATION_SESSIONS, driver)
        } else {
            AutomationFramework.setState(instance, AutomationFramework.KEY_NON_BROWSERSTACK_AUTOMATION_SESSIONS, driver)
        }
    }

    /**
     * Get the driver from the automation framework instance
     * @param {AutomationFrameworkInstance} instance - The automation framework instance
     * @returns {*} The driver object or null
     */
    static getDriver(instance: AutomationFrameworkInstance): unknown {
        let driver: unknown = null
        driver = this.isAutomationSession(instance) ? AutomationFramework.getState(instance, AutomationFramework.KEY_AUTOMATION_SESSIONS) || null : AutomationFramework.getState(instance, AutomationFramework.KEY_NON_BROWSERSTACK_AUTOMATION_SESSIONS) || null
        return driver
    }
}
