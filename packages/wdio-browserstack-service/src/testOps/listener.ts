import UsageStats from './usageStats.js'
import type FeatureStats from './featureStats.js'
import RequestQueueHandler from '../request-handler.js'
import type { CBTData, LogData, ScreenshotLog, TestData, UploadType } from '../types.js'
import { batchAndPostEvents, isTrue, sleep } from '../util.js'
import {
    DATA_BATCH_ENDPOINT,
    DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS,
    DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS,
    LOG_KIND_USAGE_MAP, TESTOPS_BUILD_COMPLETED_ENV,
    TEST_ANALYTICS_ID
} from '../constants.js'
import { sendScreenshots } from './requestUtils.js'
import { BStackLogger } from '../bstackLogger.js'
import { shouldProcessEventForTesthub } from '../testHub/utils.js'

class Listener {
    private static instance: Listener
    private readonly usageStats: UsageStats = UsageStats.getInstance()
    private readonly testStartedStats: FeatureStats = this.usageStats.testStartedStats
    private readonly testFinishedStats: FeatureStats = this.usageStats.testFinishedStats
    private readonly hookStartedStats: FeatureStats = this.usageStats.hookStartedStats
    private readonly hookFinishedStats: FeatureStats = this.usageStats.hookFinishedStats
    private readonly cbtSessionStats: FeatureStats = this.usageStats.cbtSessionStats
    private readonly logEvents: FeatureStats = this.usageStats.logStats
    private requestBatcher?: RequestQueueHandler
    private pendingUploads = 0
    private static _accessibilityOptions?: { [key: string]: any; }
    private static _testRunAccessibilityVar?: boolean = false

    // Making the constructor private to use singleton pattern
    private constructor() {
    }

    public static getInstance(): Listener {
        if (!Listener.instance) {
            Listener.instance = new Listener()
        }
        return Listener.instance
    }

    public static setAccessibilityOptions(options:  { [key: string]: any; } | undefined) {
        Listener._accessibilityOptions = options
    }

    public static setTestRunAccessibilityVar(accessibility: boolean | undefined) {
        Listener._testRunAccessibilityVar = accessibility
    }

    public async onWorkerEnd() {
        try {
            await this.uploadPending()
            await this.teardown()
        } catch (e) {
            BStackLogger.debug('Exception in onWorkerEnd: ' + e)
        }
    }

    async uploadPending(waitTimeout = DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS, waitInterval = DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS): Promise<unknown> {
        if ((this.pendingUploads <= 0) || waitTimeout <= 0) {
            return
        }

        await sleep(waitInterval)
        return this.uploadPending(waitTimeout - waitInterval)
    }

    async teardown() {
        BStackLogger.debug('teardown started')
        RequestQueueHandler.tearDownInvoked = true
        await this.requestBatcher?.shutdown()
        BStackLogger.debug('teardown ended')
    }

    public hookStarted(hookData: TestData): void {
        try {
            if (!shouldProcessEventForTesthub('HookRunStarted')) {
                return
            }
            this.hookStartedStats.triggered()
            this.sendBatchEvents(this.getEventForHook('HookRunStarted', hookData))
        } catch (e) {
            this.hookStartedStats.failed()
            throw e
        }
    }

    public hookFinished(hookData: TestData): void {
        try {
            if (!shouldProcessEventForTesthub('HookRunFinished')) {
                return
            }
            this.hookFinishedStats.triggered(hookData.result)
            this.sendBatchEvents(this.getEventForHook('HookRunFinished', hookData))
        } catch (e) {
            this.hookFinishedStats.failed(hookData.result)
            throw e
        }
    }

    public testStarted(testData: TestData): void {
        try {
            if (!shouldProcessEventForTesthub('TestRunStarted')) {
                return
            }
            process.env[TEST_ANALYTICS_ID] = testData.uuid
            this.testStartedStats.triggered()

            testData.product_map = {
                accessibility: Listener._testRunAccessibilityVar
            }

            this.sendBatchEvents(this.getEventForHook('TestRunStarted', testData))
        } catch (e) {
            this.testStartedStats.failed()
            throw e
        }
    }

    public testFinished(testData: TestData): void {
        try {
            if (!shouldProcessEventForTesthub('TestRunFinished')) {
                return
            }

            testData.product_map = {
                accessibility: Listener._testRunAccessibilityVar
            }

            this.testFinishedStats.triggered(testData.result)
            this.sendBatchEvents(this.getEventForHook('TestRunFinished', testData))
        } catch (e) {
            this.testFinishedStats.failed(testData.result)
            throw e
        }
    }

    public logCreated(logs: LogData[]): void {
        try {
            if (!shouldProcessEventForTesthub('LogCreated')) {
                return
            }
            this.markLogs('triggered', logs)
            this.sendBatchEvents({
                event_type: 'LogCreated', logs: logs
            })
        } catch (e) {
            this.markLogs('failed', logs)
            throw e
        }
    }

    public async onScreenshot(jsonArray: ScreenshotLog[]) {
        if (!this.shouldSendEvents()) {
            return
        }
        try {
            if (!shouldProcessEventForTesthub('LogCreated')) {
                return
            }
            this.markLogs('triggered', jsonArray)
            this.pendingUploads += 1
            await sendScreenshots([{
                event_type: 'LogCreated', logs: jsonArray
            }])
            this.markLogs('success', jsonArray)
        } catch (e) {
            this.markLogs('failed', jsonArray)
            throw e
        } finally {
            this.pendingUploads -= 1
        }
    }

    public cbtSessionCreated(data: CBTData): void {
        try {
            if (!shouldProcessEventForTesthub('CBTSessionCreated')) {
                return
            }
            this.cbtSessionStats.triggered()
            this.sendBatchEvents({ event_type: 'CBTSessionCreated', test_run: data })
        } catch (e) {
            this.cbtSessionStats.failed()
            throw e
        }
    }

    private markLogs(status: string, data?: LogData[]): void {
        if (!data) {
            BStackLogger.debug('No log data')
            return
        }
        try {
            for (const _log of data) {
                const kind = _log.kind
                this.logEvents.mark(status, LOG_KIND_USAGE_MAP[kind] || kind)
            }
        } catch (e) {
            BStackLogger.debug('Exception in marking logs status ' + e)
            throw e
        }
    }

    private getResult(jsonObject: UploadType, kind: string): string | undefined {
        const runStr = kind === 'test' ? 'test_run' : 'hook_run'
        const runData = jsonObject[runStr]
        return (runData as TestData)?.result
    }

    private shouldSendEvents() {
        return isTrue(process.env[TESTOPS_BUILD_COMPLETED_ENV])
    }

    private sendBatchEvents(jsonObject: UploadType): void {
        if (!this.shouldSendEvents()) {
            return
        }

        if (!this.requestBatcher) {
            this.requestBatcher = RequestQueueHandler.getInstance(async (data: UploadType[]) => {
                BStackLogger.debug('callback: called with events ' + data.length)
                try {
                    this.pendingUploads += 1
                    await batchAndPostEvents(DATA_BATCH_ENDPOINT, 'BATCH_DATA', data)
                    BStackLogger.debug('callback: marking events success ' + data.length)
                    this.eventsSuccess(data)
                } catch (e) {
                    BStackLogger.debug('callback: marking events failed ' + data.length)
                    this.eventsFailed(data)
                } finally {
                    this.pendingUploads -= 1
                }
            })
        }
        this.requestBatcher.add(jsonObject)
    }

    private eventsFailed(events: UploadType[]): void {
        for (const event of events) {
            const eventType: string = event.event_type
            if (eventType === 'TestRunStarted') {
                this.testStartedStats.failed()
            } else if (eventType === 'TestRunFinished') {
                this.testFinishedStats.failed(this.getResult(event, 'test'))
            } else if (eventType === 'HookRunStarted') {
                this.hookStartedStats.failed()
            } else if (eventType === 'HookRunFinished') {
                this.hookFinishedStats.failed(this.getResult(event, 'hook'))
            } else if (eventType === 'CBTSessionCreated') {
                this.cbtSessionStats.failed()
            } else if (eventType === 'LogCreated') {
                this.markLogs('failed', event.logs)
            }
        }
    }

    private eventsSuccess(events: UploadType[]): void {
        for (const event of events) {
            const eventType: string = event.event_type
            if (eventType === 'TestRunStarted') {
                this.testStartedStats.success()
            } else if (eventType === 'TestRunFinished') {
                this.testFinishedStats.success(this.getResult(event, 'test'))
            } else if (eventType === 'HookRunStarted') {
                this.hookStartedStats.success()
            } else if (eventType === 'HookRunFinished') {
                this.hookFinishedStats.success(this.getResult(event, 'hook'))
            } else if (eventType === 'CBTSessionCreated') {
                this.cbtSessionStats.success()
            } else if (eventType === 'LogCreated') {
                this.markLogs('success', event.logs)
            }
        }
    }

    private getEventForHook(eventType: string, data: TestData): UploadType {
        return {
            event_type: eventType, [data.type === 'hook' ? 'hook_run' : 'test_run']: data
        }
    }
}

export default Listener
