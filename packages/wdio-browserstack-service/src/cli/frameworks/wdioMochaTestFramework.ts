import { v4 as uuidv4 } from 'uuid'
import path from 'node:path'

import TestFramework from './testFramework.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { HookState } from '../states/hookState.js'
import TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import { CLIUtils } from '../cliUtils.js'
import TrackedInstance from '../instances/trackedInstance.js'
import { TestFrameworkConstants } from './constants/testFrameworkConstants.js'
import { BStackLogger as logger } from '../cliLogger.js'
import type { Frameworks } from '@wdio/types'
import { getGitMetaData, getHierarchyFromTest, getUniqueIdentifier, isUndefined, removeAnsiColors } from '../../util.js'

export default class WdioMochaTestFramework extends TestFramework {
    static KEY_HOOK_LAST_STARTED = 'test_hook_last_started'
    static KEY_HOOK_LAST_FINISHED = 'test_hook_last_finished'
    public hookEvents = ['BEFORE_CLASS', 'BEFORE_GROUPS', 'BEFORE_METHOD', 'BEFORE_SUITE', 'BEFORE_TEST', 'AFTER_CLASS', 'AFTER_GROUPS', 'AFTER_METHOD', 'AFTER_SUITE', 'AFTER_TEST']

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
    async trackEvent(testFrameworkState: State, hookState: State, args: Record<string, unknown> = {}) {
        logger.info(`trackEvent: testFrameworkState=${testFrameworkState} hookState=${hookState}`)
        await super.trackEvent(testFrameworkState, hookState, args)

        const instance = this.resolveInstance(testFrameworkState, hookState, args)
        if (instance === null) {
            logger.error(`trackEvent: instance not found for testFrameworkState=${testFrameworkState} hookState=${hookState}`)
            return
        }

        try {
            if (CLIUtils.matchHookRegex(testFrameworkState.toString()) && hookState === HookState.PRE) {
                instance.updateMultipleEntries({
                    [TestFrameworkConstants.KEY_HOOK_ID]: uuidv4(),
                })
            }

            if (!TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_ID) && hookState === HookState.PRE && testFrameworkState === TestFrameworkState.TEST) {
                const test = args.test as Frameworks.Test
                const testData = await this.getTestData(instance, test)
                // logger.info(`trackEvent: testData=${JSON.stringify(testData)}`)
                logger.info(`trackEvent: instanceData=${JSON.stringify(Object.fromEntries(instance.getAllData()))}`)
                instance.updateMultipleEntries(testData)
            }

            if (testFrameworkState === TestFrameworkState.TEST) {
                if (hookState === HookState.PRE) {
                    instance.updateMultipleEntries({
                        [TestFrameworkConstants.KEY_TEST_STARTED_AT]: new Date().toISOString(),
                    })
                } else if (hookState === HookState.POST) {
                    instance.updateMultipleEntries({
                        [TestFrameworkConstants.KEY_TEST_ENDED_AT]: new Date().toISOString(),
                    })
                }
            } else if (testFrameworkState === TestFrameworkState.LOG) {
                const logEntry = args.logEntry as Record<string, unknown>
                logEntry.uuid = TestFramework.getState(instance, TestFrameworkConstants.KEY_HOOK_ID)
                this.loadLogEntries(instance, testFrameworkState, hookState, logEntry)
            } else if (testFrameworkState === TestFrameworkState.LOG_REPORT && hookState === HookState.POST) {
                logger.info('trackEvent: load test results')
                this.loadTestResult(instance, args)
            }

            await this.trackHookEvents(instance, testFrameworkState, hookState, args)
            logger.info(`trackEvent: tracked instance data=${JSON.stringify(Object.fromEntries(instance.getAllData()))}`)
        } catch (error) {
            logger.error(`trackEvent: Error in tracking events: ${error} hookState=${hookState} testFrameworkState=${testFrameworkState}`)
        }

        args.instance = instance
        await this.runHooks(instance, testFrameworkState, hookState, args)
    }

    /**
   * Resolve instance for the test framework
   * @param {TestFrameworkState} testFrameworkState
   * @param {HookState} hookState
   * @param {*} args
   * @returns {TestFrameworkInstance}
   */
    resolveInstance(testFrameworkState: State, hookState: State, args: Record<string, unknown> = {}): TestFrameworkInstance|null {
        let instance = null
        logger.info(`resolveInstance: resolving instance for testFrameworkState=${testFrameworkState} hookState=${hookState}`)
        if (testFrameworkState === TestFrameworkState.INIT_TEST || testFrameworkState === TestFrameworkState.NONE) {
            this.trackWdioMochaInstance(testFrameworkState, args)
        }

        instance = TestFramework.getTrackedInstance()
        this.updateInstanceState(instance, testFrameworkState, hookState)

        return instance
    }

    /**
   * Track WebdriverIO instance
   * @param {TestFrameworkState} testFrameworkState
   * @param {*} args
   */
    trackWdioMochaInstance(testFrameworkState: State, args: Record<string, unknown>) {
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
        // const test = args.test as Frameworks.Test

        const instanceEntries = {
            [TestFrameworkConstants.KEY_TEST_FRAMEWORK_NAME]: frameworkName,
            [TestFrameworkConstants.KEY_TEST_FRAMEWORK_VERSION]: this.getTestFrameworksVersions()[frameworkName],
            [TestFrameworkConstants.KEY_TEST_LOGS]: [],
            [TestFrameworkConstants.KEY_HOOKS_FINISHED]: new Map(),
            [TestFrameworkConstants.KEY_HOOKS_STARTED]: new Map(),
            [TestFrameworkConstants.KEY_TEST_UUID]: uuidv4(),
            [TestFrameworkConstants.KEY_TEST_RESULT]: TestFrameworkConstants.DEFAULT_TEST_RESULT,
            // [TestFrameworkConstants.KEY_AUTOMATE_SESSION_NAME]: test.title || test.description,
            // TODO[CLI]: Add customRerunParam
            // [TestFrameworkConstants.KEY_TEST_RERUN_NAME]:
        }

        instance.updateMultipleEntries(instanceEntries)

        TestFramework.setTrackedInstance(trackedContext, instance)
        logger.info(`trackWdioMochaInstance: saved instance contextId=${trackedContext.getId()} target=${target}`)
    }

    async getTestData(instance: TestFrameworkInstance, test: Frameworks.Test) {
        const framework = TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_FRAMEWORK_NAME)
        const fullTitle = getUniqueIdentifier(test, framework)
        const gitConfig = await getGitMetaData()
        const filename = test.file // || this._suiteFile

        const testData: Record<string, unknown> = {
            [TestFrameworkConstants.KEY_TEST_ID]: getUniqueIdentifier(test, framework),
            [TestFrameworkConstants.KEY_TEST_NAME]: test.title || test.description,
            // [TestFrameworkConstants.KEY_TEST_TAGS]: test.tags || [],
            [TestFrameworkConstants.KEY_TEST_CODE]: test.body || '',
            [TestFrameworkConstants.KEY_TEST_FILE_PATH]: (gitConfig?.root && filename) ? path.relative(gitConfig.root, filename) : undefined,
            [TestFrameworkConstants.KEY_TEST_LOCATION]: filename ? path.relative(process.cwd(), filename) : undefined,
            [TestFrameworkConstants.KEY_TEST_SCOPE]: fullTitle,
            [TestFrameworkConstants.KEY_TEST_SCOPES]: getHierarchyFromTest(test),
        }

        return testData
    }

    loadTestResult(instance: TestFrameworkInstance, args: Record<string, unknown>) {
        const results = args.result as Frameworks.TestResult
        const { error, passed } = results
        let result = 'passed'
        let failure: Array<unknown>|null = null
        let failureReason: string|null = null
        let failureType: string|null = null
        if (!passed) {
            result = (error && error.message && error.message.includes('sync skip; aborting execution')) ? 'ignore' : 'failed'
            if (error && result !== 'skipped') {
                failure = [{ backtrace: [removeAnsiColors(error.message), removeAnsiColors(error.stack || '')] }] // add all errors here
                failureReason = removeAnsiColors(error.message)
                failureType = isUndefined(error.message) ? null : error.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError' //verify if this is working
            }
        }

        instance.updateMultipleEntries({
            [TestFrameworkConstants.KEY_TEST_RESULT]: result,
            [TestFrameworkConstants.KEY_TEST_FAILURE]: failure,
            [TestFrameworkConstants.KEY_TEST_FAILURE_REASON]: failureReason,
            [TestFrameworkConstants.KEY_TEST_FAILURE_TYPE]: failureType,
        })
    }

    /**
     * Load log entries into the test framework instance.
     * @param instance TestFrameworkInstance
     * @param testFrameworkState TestFrameworkState
     * @param hookState HookState
     * @param args Additional arguments (level, message, etc.)
     */
    loadLogEntries(instance: TestFrameworkInstance, testFrameworkState: State, hookState: State, logEntry: Record<string, unknown>) {
        const logRecord: Record<string, unknown> = {}
        const { level, message, timestamp } = logEntry

        if (CLIUtils.matchHookRegex(instance.getCurrentTestState().toString())) {
            logRecord[TestFrameworkConstants.KEY_HOOK_ID] = TestFramework.getState(instance, TestFrameworkConstants.KEY_HOOK_ID)
        }
        logRecord.kind = TestFrameworkConstants.KIND_LOG
        logRecord.message = Buffer.from(message as string)
        logRecord.level = level
        logRecord.timestamp = timestamp

        // Attach to the suitable hook
        const lastActiveHook = WdioMochaTestFramework.lastActiveHook(instance, WdioMochaTestFramework.KEY_HOOK_LAST_STARTED)
        if (lastActiveHook) {
            const hookLogs = lastActiveHook[TestFrameworkConstants.KEY_HOOK_LOGS] as unknown[]
            hookLogs.push(logRecord)
            logger.debug(`hooks after update logs ${TestFramework.getState(instance, TestFrameworkConstants.KEY_HOOKS_STARTED)} ${TestFramework.getState(instance, TestFrameworkConstants.KEY_HOOKS_FINISHED)}`)
            return
        }

        // Attach to the test instance
        const entries = TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_LOGS) as unknown[]
        entries.push(logRecord)
        instance.updateMultipleEntries({
            [TestFrameworkConstants.KEY_TEST_LOGS]: entries,
        })
    }

    /**
     * Get the last active hook for the given instance and hook key.
     * @param instance TestFrameworkInstance
     * @param lastHookKey string
     * @returns Record<string, unknown> | null
     */
    static lastActiveHook(instance: TestFrameworkInstance, lastHookKey: string): Record<string, unknown> | null {
        const hookStore = lastHookKey === WdioMochaTestFramework.KEY_HOOK_LAST_FINISHED
            ? TestFrameworkConstants.KEY_HOOKS_FINISHED
            : TestFrameworkConstants.KEY_HOOKS_STARTED

        const lastActive = TestFramework.getState(instance, lastHookKey) as string | null
        let hooksMap: Record<string, unknown> | null = null

        if (lastActive) {
            hooksMap = TestFramework.getState(instance, hookStore) as Record<string, unknown> | null
        }

        if (hooksMap && lastActive && hooksMap[lastActive]) {
            const lastHooks = hooksMap[lastActive] as unknown[]
            if (lastHooks.length > 0) {
                return lastHooks[lastHooks.length - 1] as Record<string, unknown>
            }
        }
        return null
    }

    /**
     * Clear logs for a specific hook.
     * @param instance TestFrameworkInstance
     * @param lastHookKey string
     */
    static clearHookLogs(instance: TestFrameworkInstance, lastHookKey: string) {
        const hook = this.lastActiveHook(instance, lastHookKey)
        if (hook) {
            hook[TestFrameworkConstants.KEY_HOOK_LOGS] = []
        }
    }

    /**
     * Clear all logs for the given instance, test framework state, and hook state.
     * @param instance TestFrameworkInstance
     * @param testFrameworkState TestFrameworkState
     * @param hookState HookState
     */
    static clearLogs(instance: TestFrameworkInstance, testFrameworkState: State, hookState: State) {
        const lastHookKey = hookState === HookState.PRE
            ? WdioMochaTestFramework.KEY_HOOK_LAST_STARTED
            : WdioMochaTestFramework.KEY_HOOK_LAST_FINISHED

        WdioMochaTestFramework.clearHookLogs(instance, lastHookKey)

        instance.updateMultipleEntries({
            [TestFrameworkConstants.KEY_TEST_LOGS]: [],
        })
    }

    /**
     * Get all log entries for the given instance, test framework state, and hook state.
     * @param instance TestFrameworkInstance
     * @param testFrameworkState TestFrameworkState
     * @param hookState HookState
     * @returns unknown[]
     */
    static getLogEntries(instance: TestFrameworkInstance, testFrameworkState: State, hookState: State): unknown[] {
        const lastHookKey = hookState === HookState.PRE
            ? WdioMochaTestFramework.KEY_HOOK_LAST_STARTED
            : WdioMochaTestFramework.KEY_HOOK_LAST_FINISHED

        const hook = WdioMochaTestFramework.lastActiveHook(instance, lastHookKey)
        const entries = hook ? (hook[TestFrameworkConstants.KEY_HOOK_LOGS] as unknown[]) : []
        const testEntries = TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_LOGS) as unknown[]

        return [...entries, ...testEntries]
    }

    /**
     * Track hook events for the test framework.
     * @param instance TestFrameworkInstance
     * @param testFrameworkState TestFrameworkState
     * @param hookState HookState
     * @param args Additional arguments (e.g., test result, test method)
     */
    async trackHookEvents(
        instance: TestFrameworkInstance,
        testFrameworkState: State,
        hookState: State,
        args: Record<string, unknown>
    ) {
        const testResult = args.result as Frameworks.TestResult
        const test = args.test as Frameworks.Test
        // const testData = CLIUtils.getBeforeClassData(testResult)
        const key = testFrameworkState.toString()

        const hooksStarted = TestFramework.getState(instance, TestFrameworkConstants.KEY_HOOKS_STARTED) as Map<string, unknown[]>
        if (!hooksStarted.has(key)) {
            hooksStarted.set(key, [])
        }

        const hooksFinished = TestFramework.getState(instance, TestFrameworkConstants.KEY_HOOKS_FINISHED) as Map<string, unknown[]>
        if (!hooksFinished.has(key)) {
            hooksFinished.set(key, [])
        }

        const updates: Record<string, unknown> = {
            [TestFrameworkConstants.KEY_HOOKS_STARTED]: hooksStarted,
            [TestFrameworkConstants.KEY_HOOKS_FINISHED]: hooksFinished,
        }

        logger.info(`args CHECK = ${JSON.stringify(args)}`)

        if (hookState === HookState.PRE) {
            const gitConfig = await getGitMetaData()
            const filename = test.file
            const hook: Record<string, unknown> = {
                key,
                [TestFrameworkConstants.KEY_HOOK_ID]: TestFramework.getState(instance, TestFrameworkConstants.KEY_HOOK_ID) || '',
                [TestFrameworkConstants.KEY_HOOK_RESULT]: TestFrameworkConstants.DEFAULT_HOOK_RESULT,
                [TestFrameworkConstants.KEY_EVENT_STARTED_AT]: new Date().toISOString(),
                [TestFrameworkConstants.KEY_HOOK_LOGS]: [],
                [TestFrameworkConstants.KEY_HOOK_NAME]: test.title || test.description,
                [TestFrameworkConstants.KEY_TEST_FILE_PATH]: (gitConfig?.root && filename) ? path.relative(gitConfig.root, filename) : undefined,
                [TestFrameworkConstants.KEY_TEST_LOCATION]: filename ? path.relative(process.cwd(), filename) : undefined,
            }
            hooksStarted.get(key)?.push(hook)
            updates[WdioMochaTestFramework.KEY_HOOK_LAST_STARTED] = key
            logger.info(`Hook Started in PRE key = ${key} & hook = ${JSON.stringify(hook)} and args = ${JSON.stringify(args)}`)
        } else if (hookState === HookState.POST) {
            const hooksList = hooksStarted.get(key) || []
            logger.info(`Hook List in Post ${JSON.stringify(hooksList)} and args = ${JSON.stringify(args)}`)

            if (hooksList.length > 0) {
                const hook = hooksList.pop() as Record<string, unknown>
                const result = testResult.status
                if (result !== TestFrameworkConstants.DEFAULT_HOOK_RESULT) {
                    hook[TestFrameworkConstants.KEY_HOOK_RESULT] = result
                }
                hook[TestFrameworkConstants.KEY_EVENT_ENDED_AT] = new Date().toISOString()
                hooksFinished.get(key)?.push(hook)
                updates[WdioMochaTestFramework.KEY_HOOK_LAST_FINISHED] = key
            }
        }

        instance.updateMultipleEntries(updates)
        logger.info(`trackHookEvents: hook state=${key}.${hookState}, hooks started=${JSON.stringify(hooksStarted)}, hooks finished=${JSON.stringify(hooksFinished)}`)
    }
}
