import logger from '@wdio/logger'

import WorkerInstance from './worker'

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

        /**
         * ensure to delete worker from pool once exited
         */
        worker.on('exit', ({ cid }) => {
            log.debug(`Remove worker with cid ${cid} from pool`)
            delete this.workerPool[cid]
            const workerCnt = this.getWorkerCount()
            process.stdout.setMaxListeners(workerCnt + 2)
            process.stderr.setMaxListeners(workerCnt + 2)
        })

        return worker
    }
}
