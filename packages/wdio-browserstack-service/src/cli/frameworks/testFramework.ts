import { CLIUtils } from '../cliUtils.js'
import { eventDispatcher } from '../eventDispatcher.js'
import { BStackLogger as logger } from '../cliLogger.js'
import type TrackedContext from '../instances/trackedContext.js'
import TrackedInstance from '../instances/trackedInstance.js'
import type TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import type { TrackedData } from '../../types.js'

type State = {
    value: number
    toString(): string
}

export default class TestFramework {
    static instances = new Map()
    testFrameworks: Array<string> = []
    testFrameworkVersions: Record<string, string> = {}
    binSessionId: string|null = null

    /**
   * Constructor for the TestFramework
   * @param {Array} testFrameworks - List of Test frameworks
   * @param {Map} testFrameworkVersions - Name of the Test frameworks
   * @param {string} binSessionId - BinSessionId
  */
    constructor(testFrameworks: Array<string>, testFrameworkVersions: Record<string, string>, binSessionId: string) {
        this.testFrameworks = testFrameworks
        this.testFrameworkVersions = testFrameworkVersions
        this.binSessionId = binSessionId
    }

    /**
   * get all instances
   * @return {Map} - return all instances Map
  */
    getInstances() {
        return TestFramework.instances
    }

    /**
   * set testFrameworkInstance
   * @param {TrackedContext} context
   * @param {TestFrameworkInstance} instance
  */
    setInstance(context: TrackedContext, instance: TestFrameworkInstance) {
        TestFramework.instances.set(context.getId, instance)
    }

    /**
   * Find instance and track any state for the test framework
   * @returns instance
  */
    static getTrackedInstance() {
        const ctx = TrackedInstance.createContext(CLIUtils.getCurrentInstanceName())
        return TestFramework.instances.get(ctx.getId())
    }

    /**
   * Set tracked instance
   * @returns {string} The name of the test framework
   */
    static setTrackedInstance(context: TrackedContext, instance: TestFrameworkInstance) {
        TestFramework.instances.set(context.getId(), instance)
    }

    /**
   * get all test framework versions
   * @returns {Map} - return all versions of framework available.
   */
    getTestFrameworksVersions() {
        return this.testFrameworkVersions
    }

    /**
   * get all test frameworks
   * @returns {Array} - return all test frameworks
   */
    getTestFrameworks() {
        return this.testFrameworks
    }

    /**
   * Track an event
   * @param {TestFrameworkState} testFrameworkState
   * @param {HookState} hookState
   * @param {*} args
   * @returns {void}
   */
    trackEvent(testFrameworkState: State, hookState: State, args: unknown = {}) {
        logger.info(`trackEvent: testFrameworkState=${testFrameworkState}; hookState=${hookState}; args=${args}`)
    }

    /**
   * run test hooks
   * @param {TestFrameworkInstance} instance
   * @param {TestFrameworkState} testFrameworkState
   * @param {HookState} hookState
   * @param {*} args
   */
    async runHooks(instance: TestFrameworkInstance, testFrameworkState: State, hookState: State, args: unknown = {}) {
        logger.info(`runHooks: instance=${instance} automationFrameworkState=${testFrameworkState} hookState=${hookState}`)

        const hookRegistryKey = CLIUtils.getHookRegistryKey(testFrameworkState, hookState)
        await eventDispatcher.notifyObserver(hookRegistryKey, args)
    }

    /**
   * Register an observer
   * @param {TestFrameworkState} testFrameworkState
   * @param {HookState} hookState
   * @param {*} callback
   * @returns {void}
   */
    static registerObserver(testFrameworkState: State, hookState: State, callback: Function) {
        eventDispatcher.registerObserver(CLIUtils.getHookRegistryKey(testFrameworkState, hookState), callback)
    }

    /**
   * Resolve instance for the test framework
   * @param {TestFrameworkInstance} testFrameworkInstance
   * @param {string} key
   * @returns {TestFrameworkInstance}
   */
    static getState(instance: TestFrameworkInstance, key: string) {
        return instance.getAllData().get(key)
    }

    static hasState(instance: TestFrameworkInstance, key: string) {
        return instance.hasData(key)
    }

    /**
   * Set the state
   * @param {TrackedInstance} instance - The instance
   * @param {string} key - The key
   * @param {*} value - The value
   * @returns
   */
    static setState(instance: TrackedInstance, key: string, value: TrackedData) {
        instance.getAllData().set(key, value)
    }

    updateInstanceState(instance: TestFrameworkInstance, testFrameworkState: State, hookState: State) {
        instance.setLastTestState(instance.getCurrentTestState())
        instance.setLastHookState(instance.getCurrentHookState())
        instance.setCurrentTestState(testFrameworkState)
        instance.setCurrentHookState(hookState)
    }

}
