import logger from '@wdio/logger'
import { WritableStreamBuffer } from 'stream-buffers'

import WorkerInstance from './worker'
import { SHUTDOWN_TIMEOUT, BUFFER_OPTIONS } from './constants'
import type { WorkerRunPayload } from './types'

const log = logger('@wdio/local-runner')

interface RunArgs extends WorkerRunPayload {
    command: string
    args: any
}

export default class LocalRunner {
    config: WebdriverIO.Config
    workerPool: Record<string, WorkerInstance> = {}

    stdout: WritableStreamBuffer
    stderr: WritableStreamBuffer

    constructor (configFile: string, config: WebdriverIO.Config) {
        this.config = config

        this.stdout = new WritableStreamBuffer(BUFFER_OPTIONS)
        this.stderr = new WritableStreamBuffer(BUFFER_OPTIONS)
    }

    /**
     * nothing to initialise when running locally
     */
    initialise () {}

    getWorkerCount () {
        return Object.keys(this.workerPool).length
    }

    run ({ command, args, ...workerOptions }: RunArgs) {
        /**
         * adjust max listeners on stdout/stderr when creating listeners
         */
        const workerCnt = this.getWorkerCount()
        if (workerCnt >= process.stdout.getMaxListeners() - 2) {
            process.stdout.setMaxListeners(workerCnt + 2)
            process.stderr.setMaxListeners(workerCnt + 2)
        }

        const worker = new WorkerInstance(this.config, workerOptions, this.stdout, this.stderr)
        this.workerPool[workerOptions.cid] = worker
        worker.postMessage(command, args)

        return worker
    }

    /**
     * shutdown all worker processes
     *
     * @return {Promise}  resolves when all worker have been shutdown or
     *                    a timeout was reached
     */
    shutdown () {
        log.info('Shutting down spawned worker')

        for (const [cid, worker] of Object.entries(this.workerPool)) {
            const { caps, sessionId, config, isMultiremote, instances } = worker
            let payload = {}

            /**
             * put connection information to payload if in watch mode
             * in order to attach to browser session and kill it
             */
            if (config && config.watch && sessionId) {
                payload = { config: { sessionId }, caps, watch: true, isMultiremote, instances }
            } else if (!worker.isBusy) {
                delete this.workerPool[cid]
                continue
            }

            worker.postMessage('endSession', payload)
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(resolve, SHUTDOWN_TIMEOUT)
            const interval = setInterval(() => {
                const busyWorker = Object.entries(this.workerPool)
                    .filter(([, worker]) => worker.isBusy).length

                log.info(`Waiting for ${busyWorker} to shut down gracefully`)
                if (busyWorker === 0) {
                    clearTimeout(timeout)
                    clearInterval(interval)
                    log.info('shutting down')
                    return resolve()
                }
            }, 250)
        })
    }
}
