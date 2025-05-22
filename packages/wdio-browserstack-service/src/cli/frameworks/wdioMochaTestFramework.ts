import { v4 as uuidv4 } from 'uuid'

import TestFramework from './testFramework.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { HookState } from '../states/hookState.js'
import TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import { CLIUtils } from '../cliUtils.js'
import TrackedInstance from '../instances/trackedInstance.js'
import { TestFrameworkConstants } from './constants/testFrameworkConstants.js'
import { BStackLogger as logger } from '../cliLogger.js'

export default class WdioMochaTestFramework extends TestFramework {

    /**
   * Constructor for the TestFramework
   * @param {Array} testFrameworks - List of Test frameworks
   * @param {Map} testFrameworkVersions - Name of the Test frameworks
   * @param {string} binSessionId - BinSessionId
  */
    constructor(testFrameworks: string[], testFrameworkVersions: Record<string, string>, binSessionId: string) {
        super(testFrameworks, testFrameworkVersions, binSessionId)
    }

    /**
     * Find instance and track any state for the test framework
     * @param {TestFrameworkState} testFrameworkState
     * @param {HookState} hookState
     * @param {*} args
  */
    async trackEvent(testFrameworkState: State, hookState: State, args: unknown = {}) {
        logger.info(`trackEvent: testFrameworkState=${testFrameworkState} hookState=${hookState}`)
        await super.trackEvent(testFrameworkState, hookState, args)

        const instance = this.resolveInstance(testFrameworkState, hookState, args)
        if (instance === null) {
            logger.error(`trackEvent: instance not found for testFrameworkState=${testFrameworkState} hookState=${hookState}`)
            return
        }

        // args.instance = instance
        await this.runHooks(instance, testFrameworkState, hookState, args)
    }

    /**
   * Resolve instance for the test framework
   * @param {TestFrameworkState} testFrameworkState
   * @param {HookState} hookState
   * @param {*} args
   * @returns {TestFrameworkInstance}
   */
    resolveInstance(testFrameworkState: State, hookState: State, args: unknown = {}): TestFrameworkInstance|null {
        let instance = null
        logger.info(`resolveInstance: resolving instance for testFrameworkState=${testFrameworkState} hookState=${hookState}`)
        if (testFrameworkState === TestFrameworkState.INIT_TEST || testFrameworkState === TestFrameworkState.NONE) {
            this.trackWdioMochaInstance(testFrameworkState, args)
        }

        instance = TestFramework.getTrackedInstance()
        return instance
    }

    /**
   * Track WebdriverIO instance
   * @param {TestFrameworkState} testFrameworkState
   * @param {*} args
   */
    trackWdioMochaInstance(testFrameworkState: State, args: unknown) {
        const target = CLIUtils.getCurrentInstanceName()
        const trackedContext = TrackedInstance.createContext(target)
        let instance = null
        logger.info(`trackWdioMochaInstance: created instance for target=${target}, state=${testFrameworkState}, args=${args}`)

        instance = new TestFrameworkInstance(
            trackedContext,
            this.getTestFrameworks(),
            this.getTestFrameworksVersions(),
            testFrameworkState,
            HookState.NONE
        )

        const frameworkName = this.getTestFrameworks()[0]
        // const sessionName = getWdioMochaSessionName(args.testInfo)

        const instanceEntries = {
            [TestFrameworkConstants.KEY_TEST_FRAMEWORK_NAME]: frameworkName,
            [TestFrameworkConstants.KEY_TEST_FRAMEWORK_VERSION]: this.getTestFrameworksVersions()[frameworkName],
            [TestFrameworkConstants.KEY_TEST_LOGS]: [],
            // [TestFrameworkConstants.KEY_HOOKS_FINISHED]: {},
            // [TestFrameworkConstants.KEY_HOOKS_STARTED]: {},
            [TestFrameworkConstants.KEY_TEST_UUID]: uuidv4(),
            [TestFrameworkConstants.KEY_TEST_RESULT]: TestFrameworkConstants.DEFAULT_TEST_RESULT,
            // [TestFrameworkConstants.KEY_AUTOMATE_SESSION_NAME]: sessionName,
            // TODO[CLI]: Add customRerunParam
            // [TestFrameworkConstants.KEY_TEST_RERUN_NAME]:
        }

        instance.updateMultipleEntries(instanceEntries)

        TestFramework.setTrackedInstance(trackedContext, instance)
        logger.info(`trackWdioMochaInstance: saved instance contextId=${trackedContext.getId()} target=${target}`)
    }

}
