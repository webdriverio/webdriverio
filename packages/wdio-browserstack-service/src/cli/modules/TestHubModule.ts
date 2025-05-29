import util from 'node:util'
import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { HookState } from '../states/hookState.js'
import { CLIUtils } from '../cliUtils.js'
import { TestFrameworkConstants } from '../frameworks/constants/testFrameworkConstants.js'
import { GrpcClient } from '../grpcClient.js'
import type TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import type { LogCreatedEventRequest, LogCreatedEventRequest_LogEntry, TestFrameworkEventRequest } from '../../proto/sdk-messages.js'
import type { Frameworks } from '@wdio/types'
import WdioMochaTestFramework from '../frameworks/wdioMochaTestFramework.js'

/**
 * TestHub Module for BrowserStack
 */
export default class TestHubModule extends BaseModule {

    logger = BStackLogger
    testhubConfig: unknown
    name: string
    static MODULE_NAME = 'TestHubModule'
    static KEY_TEST_DEFERRED = 'test_deferred'

    /**
     * Create a new TestHubModule
     */
    constructor(testhubConfig: unknown) {
        super()
        this.name = 'TestHubModule'
        this.testhubConfig = testhubConfig

        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))

        Object.values(TestFrameworkState).forEach(state => {
            Object.values(HookState).forEach(hook => {
                TestFramework.registerObserver(state, hook, this.onAllTestEvents.bind(this))
            })
        })
    }

    /**
     * Get the module name
     * @returns {string} The module name
     */
    getModuleName() {
        return TestHubModule.MODULE_NAME
    }

    onAfterTest() {
        this.logger.debug('onAfterTest: Called after test hook from cli configured module!!!')
    }

    onAllTestEvents(args: Record<string, unknown>) {
        this.logger.debug('onAllTestEvents: Called after all test events from cli configured module!!!')
        const instance = args.instance as TestFrameworkInstance
        const testState = instance.getCurrentTestState()
        const hookState = instance.getCurrentHookState()
        if (testState === TestFrameworkState.LOG) {
            this.logger.debug(`onAllTestEvents: TestFrameworkState.LOG - ${testState}`)
            const logEntries = WdioMochaTestFramework.getLogEntries(instance, testState, hookState)
            if (logEntries && logEntries.length > 0) {
                args.logEntries = logEntries
                this.sendLogCreatedEvent(args)
                WdioMochaTestFramework.clearLogs(instance, testState, hookState)
                // Handle LOG state if needed
            }
        } else if (testState === TestFrameworkState.TEST || CLIUtils.matchHookRegex(testState.toString().split('.')[1])) {
            this.sendTestFrameworkEvent(args)
        }
    }

    async sendTestFrameworkEvent(args: Record<string, unknown>) {
        try {
            const testArgs = args as { test: Frameworks.Test, instance: TestFrameworkInstance }
            const instance = testArgs.instance as TestFrameworkInstance
            const trackedContext = instance.getContext()
            const testData = instance.getAllData()
            const testFrameworkName = testData.get(TestFrameworkConstants.KEY_TEST_FRAMEWORK_NAME) || ''
            const testFrameworkVersion = testData.get(TestFrameworkConstants.KEY_TEST_FRAMEWORK_VERSION) || ''
            const startedAt = testData.get(TestFrameworkConstants.KEY_TEST_STARTED_AT) || ''
            const endedAt = testData.get(TestFrameworkConstants.KEY_TEST_ENDED_AT) || ''
            const testFrameworkState = instance.getCurrentTestState().toString().split('.')[1]
            const testHookState = instance.getCurrentHookState().toString().split('.')[1]

            this.logger.debug(`sendTestFrameworkEvent for testState: ${testFrameworkState} hookState: ${testHookState}`)
            const platformIndex = process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0
            const uuid = instance.getRef()
            const eventJson = Buffer.from(JSON.stringify(Object.fromEntries(testData)))
            const executionContext = { hash: trackedContext.getId(), threadId: trackedContext.getThreadId().toString(), processId: trackedContext.getProcessId().toString() }
            const payload: TestFrameworkEventRequest = {
                platformIndex,
                testFrameworkName,
                testFrameworkVersion,
                testFrameworkState,
                testHookState,
                startedAt,
                endedAt,
                uuid,
                eventJson,
                executionContext,
                binSessionId: '' // TODO: Dummy value, not needed
            }
            this.logger.debug(`sendTestFrameworkEvent payload: ${JSON.stringify(payload)}`)
            await GrpcClient.getInstance().testFrameworkEvent(payload)
            this.logger.debug(`sendTestFrameworkEvent complete for testState: ${testFrameworkState} hookState: ${testHookState}`)
        } catch (error) {
            this.logger.error(`Error in sendTestFrameworkEvent: ${util.format(error)}`)
        }
    }

    async sendLogCreatedEvent(args: Record<string, unknown>) {
        try {
            const testArgs = args as { test: Frameworks.Test, instance: TestFrameworkInstance }
            const logEntries = args.logEntries as Array<Record<string, unknown>>
            const instance = testArgs.instance as TestFrameworkInstance
            const trackedContext = instance.getContext()
            const testData = instance.getAllData()
            const testFrameworkName = testData.get(TestFrameworkConstants.KEY_TEST_FRAMEWORK_NAME) || ''
            const testFrameworkVersion = testData.get(TestFrameworkConstants.KEY_TEST_FRAMEWORK_VERSION) || ''
            const testFrameworkState = instance.getCurrentTestState().toString().split('.')[1]
            const testHookState = instance.getCurrentHookState().toString().split('.')[1]

            this.logger.debug(`sendLogCreatedEvent testId: testFrameworkState: ${testFrameworkState} testHookState: ${testHookState}`)
            const platformIndex = process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0
            const executionContext = { hash: trackedContext.getId(), threadId: trackedContext.getThreadId().toString(), processId: trackedContext.getProcessId().toString() }
            const payload: LogCreatedEventRequest = {
                platformIndex,
                logs: [],
                executionContext,
                binSessionId: '' // TODO: Dummy value, not needed
            }
            for (const logEntry of logEntries) {
                const logData: LogCreatedEventRequest_LogEntry = {
                    testFrameworkName,
                    testFrameworkVersion,
                    testFrameworkState,
                    uuid: logEntry[TestFrameworkConstants.KEY_HOOK_ID] || TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_UUID),
                    kind: logEntry.kind as string,
                    message: logEntry.message as Uint8Array,
                    timestamp: logEntry.timestamp as string,
                    level: logEntry.level as string,
                }
                payload.logs.push(logData)
            }
            this.logger.debug(`sendLogCreatedEvent payload: ${JSON.stringify(payload)}`)
            await GrpcClient.getInstance().logCreatedEvent(payload)
            this.logger.debug(`sendLogCreatedEvent complete for testState: ${testFrameworkState} hookState: ${testHookState}`)
        } catch (error) {
            this.logger.error(`Error in sendLogCreatedEvent: ${util.format(error)}`)
        }
    }
}
