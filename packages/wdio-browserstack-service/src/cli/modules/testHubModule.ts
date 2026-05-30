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
// eslint-disable-next-line camelcase
import type { LogCreatedEventRequest, LogCreatedEventRequest_LogEntry, TestFrameworkEventRequest, TestSessionEventRequest, AutomationSession } from '@browserstack/wdio-browserstack-service'
import type { Frameworks } from '@wdio/types'
import WdioMochaTestFramework from '../frameworks/wdioMochaTestFramework.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import { AutomationFrameworkConstants } from '../frameworks/constants/automationFrameworkConstants.js'

/**
 * TestHub Module for BrowserStack
 */
export default class TestHubModule extends BaseModule {

    logger = BStackLogger
    testhubConfig: unknown
    name: string
    static MODULE_NAME = 'TestHubModule'

    /**
     * Create a new TestHubModule
     */
    constructor(testhubConfig: unknown) {
        super()
        this.name = 'TestHubModule'
        this.testhubConfig = testhubConfig

        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.PRE, this.onBeforeTest.bind(this))

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

    onBeforeTest(args: Record<string, unknown>) {
        this.logger.debug('onBeforeTest: Called after test hook from cli configured module!!!')
        const autoInstance = AutomationFramework.getTrackedInstance() as AutomationFrameworkInstance
        const instances = [autoInstance]
        args.autoInstance = instances
        this.sendTestSessionEvent(args)
    }

    onAllTestEvents(args: Record<string, unknown>) {
        this.logger.debug('onAllTestEvents: Called after all test events from cli configured module!!!')
        const instance = args.instance as TestFrameworkInstance
        const testState = instance.getCurrentTestState()
        const hookState = instance.getCurrentHookState()
        const keyTestDeferred = TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_DEFERRED)
        if (testState === TestFrameworkState.LOG) {
            this.logger.debug(`onAllTestEvents: TestFrameworkState.LOG - ${testState}`)
            const logEntries = WdioMochaTestFramework.getLogEntries(instance, testState, hookState)
            if (logEntries && logEntries.length > 0) {
                args.logEntries = logEntries
                this.sendLogCreatedEvent(args)
                WdioMochaTestFramework.clearLogs(instance, testState, hookState)
                // Handle LOG state if needed
            }
        } else if (
            testState === TestFrameworkState.TEST &&
            hookState === HookState.POST &&
            !TestFramework.hasState(instance, TestFrameworkConstants.KEY_TEST_RESULT_AT)
        ) {
            this.logger.info('onAllTestEvents: dropping due to lack of results')
            TestFramework.setState(instance, TestFrameworkConstants.KEY_TEST_DEFERRED, true)
        } else if (
            keyTestDeferred &&
            testState === TestFrameworkState.LOG_REPORT &&
            hookState === HookState.POST &&
            TestFramework.hasState(instance, TestFrameworkConstants.KEY_TEST_RESULT_AT)
        ) {
            // Create a modified args object with updated test framework state
            instance.setCurrentTestState(TestFrameworkState.TEST)
            this.onAllTestEvents(args)
        }

        if (testState === TestFrameworkState.TEST || CLIUtils.matchHookRegex(testState.toString().split('.')[1])) {
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
            const uuid = TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_UUID) || instance.getRef()
            const eventJson = Buffer.from(JSON.stringify(Object.fromEntries(testData)))
            const executionContext = { hash: trackedContext.getId(), threadId: trackedContext.getThreadId().toString(), processId: trackedContext.getProcessId().toString() }
            const payload: Omit<TestFrameworkEventRequest, 'binSessionId'> = {
                platformIndex,
                testFrameworkName,
                testFrameworkVersion,
                testFrameworkState,
                testHookState,
                startedAt,
                endedAt,
                uuid,
                eventJson,
                executionContext
            }
            this.logger.debug(`sendTestFrameworkEvent payload: ${JSON.stringify(payload)}`)
            await GrpcClient.getInstance().testFrameworkEvent(payload)
            this.logger.debug(`sendTestFrameworkEvent complete for testState: ${testFrameworkState} hookState: ${testHookState}`)
        } catch (error) {
            this.logger.error(`Error in sendTestFrameworkEvent: ${util.format(error)}`)
        }
    }

    /**
     * Send test session event to the service
     * @param args containing test session data
     */
    async sendTestSessionEvent(args: Record<string, unknown>): Promise<void> {
        this.logger.debug('sendTestSessionEvent: Called')
        try {
            const instance = args.instance as TestFrameworkInstance
            const autoInstances = (args.autoInstance as AutomationFrameworkInstance[]) || []
            const trackedContext = instance.getContext()
            const testFWName = TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_FRAMEWORK_NAME) as string
            const testFWVersion = TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_FRAMEWORK_VERSION) as string
            const testState = instance.getCurrentTestState().toString().split('.')[1]
            const hookState = instance.getCurrentHookState().toString().split('.')[1]
            this.logger.debug('sendTestSessionEvent: setup')

            const executionContext = {
                threadId: trackedContext.getThreadId().toString(),
                processId: trackedContext.getProcessId().toString()
            }

            const payload: Omit<TestSessionEventRequest, 'binSessionId'> = {
                testFrameworkName: testFWName,
                testFrameworkVersion: testFWVersion,
                testFrameworkState: testState.toString(),
                testHookState: hookState.toString(),
                testUuid: TestFramework.getState(instance, TestFrameworkConstants.KEY_TEST_UUID).toString(),
                executionContext,
                automationSessions: [],
                platformIndex: process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0,
                capabilities: new Uint8Array()
            }

            // Try to get capabilities from the first driver
            try {
                if (autoInstances.length > 0) {
                    const driver = AutomationFramework.getDriver(autoInstances[0]) as WebdriverIO.Browser // RemoteWebDriver equivalent
                    const userCaps = JSON.stringify(driver.capabilities)
                    if (userCaps) {
                        payload.capabilities = new TextEncoder().encode(userCaps)
                    }
                }
            } catch (error) {
                this.logger.debug(`Error while getting capabilities from driver: ${error}`)
            }

            this.logger.debug(`sendTestSessionEvent: instance iteration ${JSON.stringify(autoInstances)}`)
            // Process automation instances
            for (const autoInstance of autoInstances) {
                const sessionProvider = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB) as boolean
                    ? 'browserstack'
                    : 'unknown_grid'

                const automationSession: AutomationSession = {
                    provider: sessionProvider,
                    ref: autoInstance.getRef(),
                    hubUrl: this.config.hubUrl as string,
                    frameworkSessionId: AutomationFramework.getState(
                        autoInstance,
                        AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID,
                    ).toString(),
                    frameworkName: autoInstance.frameworkName,
                    frameworkVersion: autoInstance.frameworkVersion
                }
                this.logger.debug(`sendTestSessionEvent: automationSession: ${JSON.stringify(automationSession)}`)

                payload.platformIndex = process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0
                payload.automationSessions.push(automationSession)
            }

            this.logger.debug(`sendTestSessionEvent payload: ${JSON.stringify(payload)}`)
            await GrpcClient.getInstance().testSessionEvent(payload)
            this.logger.debug(`sendTestSessionEvent complete for testState: ${testState} hookState: ${hookState}`)
        } catch (error) {
            this.logger.error(`sendTestSessionEvent: Error sending grpc call: event=${JSON.stringify(args)}, error=${error}`)
            throw new Error(`Failed to send test session event: ${error}`)
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
            const payload: Omit<LogCreatedEventRequest, 'binSessionId'> = {
                platformIndex,
                logs: [],
                executionContext
            }
            for (const logEntry of logEntries) {
                // eslint-disable-next-line camelcase
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
