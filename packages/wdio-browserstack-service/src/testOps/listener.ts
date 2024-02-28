import UsageStats from './usageStats.js'
import type FeatureStats from './featureStats.js'
import RequestQueueHandler from '../request-handler.js'
import type { LogData, ScreenshotLog, TestData, UploadType } from '../types.js'
import { batchAndPostEvents, sleep } from '../util.js'
import {
    DATA_BATCH_ENDPOINT,
    DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS,
    DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS,
    LOG_KIND_USAGE_MAP
} from '../constants.js'
import { sendScreenshots } from './requestUtils.js'
import { BStackLogger } from '../bstackLogger.js'
import * as util from 'node:util'
import fs from 'node:fs'
import path from 'node:path'

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

    private constructor() {
    }

    public static getInstance(): Listener {
        if (!Listener.instance) {
            Listener.instance = new Listener()
        }
        return Listener.instance
    }

    public async onWorkerEnd() {
        await this.uploadPending()
        await this.teardown()
        this.saveWorkerData()
    }

    async uploadPending(waitTimeout = DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS, waitInterval = DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS): Promise<unknown> {
        // @ts-ignore
        if (this.requestBatcher?.pendingUploads <= 0 || waitTimeout <= 0) { // TODO: remove ts-ignore
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
            this.hookStartedStats.triggered()
            this.sendBatchEvents(this.getEventForHook('HookRunStarted', hookData))
        } catch (e) {
            this.hookStartedStats.failed()
            throw e
        }
    }

    public hookFinished(hookData: TestData): void {
        try {
            this.hookFinishedStats.triggered(hookData.result)
            this.sendBatchEvents(this.getEventForHook('HookRunFinished', hookData))
        } catch (e) {
            this.hookFinishedStats.failed(hookData.result)
            throw e
        }
    }

    public testStarted(testData: TestData): void {
        try {
            this.testStartedStats.triggered()
            this.sendBatchEvents(this.getEventForHook('TestRunStarted', testData))
        } catch (e) {
            this.testStartedStats.failed()
            throw e
        }
    }

    public testFinished(testData: TestData): void {
        try {
            this.testFinishedStats.triggered(testData.result)
            this.sendBatchEvents(this.getEventForHook('TestRunFinished', testData))
        } catch (e) {
            this.testFinishedStats.failed(testData.result)
            throw e
        }
    }

    public logCreated(logs: LogData[]): void {
        this.markLogs('triggered', logs)
        this.sendBatchEvents({
            event_type: 'LogCreated', logs: logs
        })
    }

    public async onScreenshot(jsonArray: ScreenshotLog[]) {
        try {
            this.markLogs('triggered', jsonArray)
            // await uploadEventData([{
            //     event_type: 'LogCreated', logs: jsonArray
            // }], DATA_SCREENSHOT_ENDPOINT)
            await sendScreenshots([{
                event_type: 'LogCreated', logs: jsonArray
            }])
            this.markLogs('success', jsonArray)
        } catch (e) {
            this.markLogs('failed', jsonArray)
            throw e
        }
    }

    public cbtSessionCreated(data: any): void { // TODO: jsonArray any type
        this.cbtSessionStats.triggered()
        this.sendBatchEvents(data)
    }

    private saveWorkerData() {
        const data = {
            usageStats: this.usageStats.getDataToSave(),
        }

        // TODO: Remove after debugging
        BStackLogger.debug(`data from worker is ${util.inspect(data, { depth: 6 })}`)

        const logFolderPath = path.join(process.cwd(), 'logs', 'worker_data')
        const filePath = path.join(logFolderPath, 'worker-data-' + process.pid + '.json')

        if (!fs.existsSync(logFolderPath)) {
            fs.mkdirSync(logFolderPath, { recursive: true })
        }
        fs.writeFileSync(filePath, JSON.stringify(data))
    }

    private markLogs(status: string, data: LogData[]): void {
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
        return runData?.result
    }

    private sendBatchEvents(jsonObject: UploadType): void {
        if (!this.requestBatcher) {
            this.requestBatcher = RequestQueueHandler.getInstance(async (data: UploadType[]) => {
                BStackLogger.debug('callback: called with events ' + data.map(event => event.event_type))
                try {
                    await batchAndPostEvents(DATA_BATCH_ENDPOINT, 'BATCH_DATA', data)
                    BStackLogger.debug('callback: marking events success ' + data.map(event => event.event_type))

                    this.eventsSuccess(data)
                } catch (e) {
                    BStackLogger.debug('callback: marking events failed ' + data.map(event => event.event_type))

                    this.eventsFailed(data)
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
                // @ts-ignore
                this.markLogs('failed', event.logs) // TODO: remove ts-ignore
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
                // @ts-ignore
                this.markLogs('success', event.logs) // TODO: remove ts-ignore
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
