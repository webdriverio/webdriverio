import WorkerInstance from './worker'

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

    run ({ command, argv, ...options }) {
        const worker = new WorkerInstance(this.config, options)
        this.workerPool[options.cid] = worker
        worker.postMessage(command, argv)

        return worker
    }
}
