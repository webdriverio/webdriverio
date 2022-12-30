import logger from '@wdio/logger'

import { DATA_BATCH_SIZE, DATA_BATCH_INTERVAL, DATA_BATCH_ENDPOINT, BATCH_EVENT_TYPES, DATA_SCREENSHOT_ENDPOINT } from './constants.js'
import type { UploadType } from './types.js'
import { batchAndPostEvents } from './util.js'

const log = logger('@wdio/browserstack-service')

export default class RequestQueueHandler {
    private queue: UploadType[] = []
    private started = false
    private pollEventBatchInterval?: ReturnType<typeof setInterval>
    public pendingUploads = 0

    static instance: RequestQueueHandler

    // making it private to use singleton pattern
    private constructor() {}

    public static getInstance(): RequestQueueHandler {
        if (!RequestQueueHandler.instance) {
            RequestQueueHandler.instance = new RequestQueueHandler()
        }
        return RequestQueueHandler.instance
    }

    start () {
        if (!this.started) {
            this.started = true
            this.startEventBatchPolling()
        }
    }

    add (event: UploadType) {
        if (!process.env.BS_TESTOPS_BUILD_COMPLETED) {
            return {
                proceed: false
            }
        }

        if (!BATCH_EVENT_TYPES.includes(event.event_type)) {
            return {
                proceed: true
            }
        }

        if (event.logs && event.logs[0] && event.logs[0].kind === 'TEST_SCREENSHOT') {
            return {
                proceed: true,
                data: [event],
                url: DATA_SCREENSHOT_ENDPOINT
            }
        }

        this.queue.push(event)
        log.debug(`Added data to request queue. Queue length = ${this.queue.length}`)

        let data
        const shouldProceed = this.shouldProceed()
        if (shouldProceed) {
            data = this.queue.splice(0, DATA_BATCH_SIZE)
            this.resetEventBatchPolling()
            log.debug(`Sending data from request queue. Data length = ${data.length}, Queue length after removal = ${this.queue.length}`)
        }

        return {
            proceed: shouldProceed,
            data: data,
            url: DATA_BATCH_ENDPOINT
        }
    }

    async shutdown () {
        this.removeEventBatchPolling('Shutting down')
        while (this.queue.length > 0) {
            const data = this.queue.splice(0, DATA_BATCH_SIZE)
            await batchAndPostEvents(DATA_BATCH_ENDPOINT, 'SHUTDOWN_QUEUE', data)
        }
    }

    startEventBatchPolling () {
        this.pollEventBatchInterval = setInterval(async () => {
            if (this.queue.length > 0) {
                const data = this.queue.splice(0, DATA_BATCH_SIZE)
                log.debug(`Sending data from request queue. Data length = ${data.length}, Queue length after removal = ${this.queue.length}`)
                await batchAndPostEvents(DATA_BATCH_ENDPOINT, 'INTERVAL_QUEUE', data)
            }
        }, DATA_BATCH_INTERVAL)
    }

    resetEventBatchPolling () {
        this.removeEventBatchPolling('Resetting')
        this.startEventBatchPolling()
    }

    removeEventBatchPolling (tag: string) {
        if (this.pollEventBatchInterval) {
            log.debug(`${tag} request queue`)
            clearInterval(this.pollEventBatchInterval)
            this.started = false
        }
    }

    shouldProceed () {
        return this.queue.length >= DATA_BATCH_SIZE
    }
}
