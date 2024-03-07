import { DATA_BATCH_SIZE, DATA_BATCH_INTERVAL, TESTOPS_BUILD_COMPLETED_ENV } from './constants.js'
import type { UploadType } from './types.js'
import { BStackLogger } from './bstackLogger.js'

export default class RequestQueueHandler {
    private queue: UploadType[] = []
    private pollEventBatchInterval?: ReturnType<typeof setInterval>
    private readonly callback?: Function
    public static tearDownInvoked = false

    static instance: RequestQueueHandler

    // making it private to use singleton pattern
    private constructor(callback: Function) {
        this.callback = callback
        this.startEventBatchPolling()
    }

    public static getInstance(callback?: Function): RequestQueueHandler {
        if (!RequestQueueHandler.instance && callback) {
            RequestQueueHandler.instance = new RequestQueueHandler(callback)
        }
        return RequestQueueHandler.instance
    }

    add (event: UploadType) {
        if (!process.env[TESTOPS_BUILD_COMPLETED_ENV]) {
            throw new Error('Observability build start not completed yet.')
        }

        this.queue.push(event)
        BStackLogger.debug(`Added data to request queue. Queue length = ${this.queue.length}`)
        const shouldProceed = this.shouldProceed()
        if (shouldProceed) {
            this.sendBatch().catch((e) => {
                BStackLogger.debug('Exception in sending batch: ' + e)
            })
        }
    }

    async shutdown () {
        BStackLogger.debug('shutdown started')
        this.removeEventBatchPolling('Shutting down')
        while (this.queue.length > 0) {
            const data = this.queue.splice(0, DATA_BATCH_SIZE)
            await this.callCallback(data, 'SHUTDOWN_QUEUE')
        }
        BStackLogger.debug('shutdown ended')
    }

    startEventBatchPolling () {
        this.pollEventBatchInterval = setInterval(this.sendBatch.bind(this), DATA_BATCH_INTERVAL)
    }

    async sendBatch() {
        const data = this.queue.splice(0, DATA_BATCH_SIZE)
        if (data.length === 0) {
            return
        }
        BStackLogger.debug(`Sending data from request queue. Data length = ${data.length}, Queue length after removal = ${this.queue.length}`)
        await this.callCallback(data, 'INTERVAL_QUEUE')
    }

    callCallback = async (data: UploadType[], kind: string) => {
        BStackLogger.debug('calling callback with kind ' + kind)
        this.callback && await this.callback(data)
    }

    resetEventBatchPolling () {
        this.removeEventBatchPolling('Resetting')
        this.startEventBatchPolling()
    }

    removeEventBatchPolling (tag: string) {
        if (this.pollEventBatchInterval) {
            BStackLogger.debug(`${tag} request queue`)
            clearInterval(this.pollEventBatchInterval)
        }
    }

    shouldProceed () {
        if (RequestQueueHandler.tearDownInvoked) {
            BStackLogger.debug('Force request-queue shutdown, as test run event is received after teardown')
            return true
        }
        return this.queue.length >= DATA_BATCH_SIZE
    }
}
