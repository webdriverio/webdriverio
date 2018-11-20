import logger from '@wdio/logger'

import WorkerInstance from './worker'
import { SHUTDOWN_TIMEOUT } from './constants'

const log = logger('wdio-local-runner')

export default class LocalRunner {
    constructor (configFile, config) {
        this.configFile = configFile
        this.config = config
        this.workerPool = {}
    }

    /**
     * nothing to initialise when running locally
     */
    initialise () {}

    getWorkerCount () {
        return Object.keys(this.workerPool).length
    }

    run ({ command, argv, ...options }) {
        /**
         * adjust max listeners on stdout/stderr when creating listeners
         */
        const workerCnt = this.getWorkerCount()
        if (workerCnt >= process.stdout.getMaxListeners() - 2) {
            process.stdout.setMaxListeners(workerCnt + 2)
            process.stderr.setMaxListeners(workerCnt + 2)
        }

        const worker = new WorkerInstance(this.config, options)
        this.workerPool[options.cid] = worker
        worker.postMessage(command, argv)

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
            if (!worker.isBusy) {
                delete this.workerPool[cid]
                continue
            }

            worker.postMessage('endSession', {})
        }

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const busyWorker = Object.entries(this.workerPool)
                    .filter(([, worker]) => worker.isBusy).length

                log.info(`Waiting for ${busyWorker} to shut down gracefully`)
                if (busyWorker === 0) {
                    clearInterval(interval)
                    log.info('shutting down')
                    return resolve()
                }
            }, 250)

            setTimeout(resolve, SHUTDOWN_TIMEOUT)
        })
    }
}
