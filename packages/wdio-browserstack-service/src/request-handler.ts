import { DATA_BATCH_SIZE, DATA_BATCH_INTERVAL } from './constants.js'
import type { UploadType } from './types.js'
import { BStackLogger } from './bstackLogger.js'

export default class RequestQueueHandler {
    private queue: UploadType[] = []
    private started = false
    private pollEventBatchInterval?: ReturnType<typeof setInterval>
    public pendingUploads = 0
    private readonly callback: Function|undefined
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

    // add (event: UploadType) {
    //     if (!process.env.BS_TESTOPS_BUILD_COMPLETED) {
    //         return {
    //             proceed: false
    //         }
    //     }
    //
    //     // if (!BATCH_EVENT_TYPES.includes(event.event_type)) {
    //     //     return {
    //     //         proceed: true
    //     //     }
    //     // }
    //
    //     // if (event.logs && event.logs[0] && event.logs[0].kind === 'TEST_SCREENSHOT') {
    //     //     return {
    //     //         proceed: true,
    //     //         data: [event],
    //     //         url: DATA_SCREENSHOT_ENDPOINT
    //     //     }
    //     // }
    //
    //     this.queue.push(event)
    //     BStackLogger.debug(`Added data to request queue. Queue length = ${this.queue.length}`)
    //
    //     let data
    //     const shouldProceed = this.shouldProceed()
    //     if (shouldProceed) {
    //         data = this.queue.splice(0, DATA_BATCH_SIZE)
    //         this.resetEventBatchPolling()
    //         BStackLogger.debug(`Sending data from request queue. Data length = ${data.length}, Queue length after removal = ${this.queue.length}`)
    //     }
    //
    //     return {
    //         proceed: shouldProceed,
    //         data: data,
    //         url: DATA_BATCH_ENDPOINT
    //     }
    // }

    add (event: UploadType) {
        if (!process.env.BS_TESTOPS_BUILD_COMPLETED) {
            throw new Error('Observability build start not completed yet.')
        }

        this.queue.push(event)
        BStackLogger.debug(`Added data to request queue. Queue length = ${this.queue.length}`)
        const shouldProceed = this.shouldProceed()
        if (shouldProceed) {
            return this.sendBatch() // TODO: need to await or not?
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
        // this.pollEventBatchInterval = setInterval(async () => {
        //     if (this.queue.length > 0) {
        //         const data = this.queue.splice(0, DATA_BATCH_SIZE)
        //         BStackLogger.debug(`Sending data from request queue. Data length = ${data.length}, Queue length after removal = ${this.queue.length}`)
        //         this.pendingUploads += 1;
        //         await this.callCallback(data, 'INTERVAL_QUEUE')
        //         this.pendingUploads -= 1;
        //     }
        // }, DATA_BATCH_INTERVAL)
        this.pollEventBatchInterval = setInterval(this.sendBatch.bind(this), DATA_BATCH_INTERVAL)
    }

    async sendBatch() {
        const data = this.queue.splice(0, DATA_BATCH_SIZE)
        BStackLogger.debug(`Sending data from request queue. Data length = ${data.length}, Queue length after removal = ${this.queue.length}`)
        this.pendingUploads += 1
        await this.callCallback(data, 'INTERVAL_QUEUE')
        this.pendingUploads -= 1
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
            this.started = false
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
