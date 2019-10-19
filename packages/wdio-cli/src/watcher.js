import chokidar from 'chokidar'
import logger from '@wdio/logger'
import pickBy from 'lodash.pickby'
import flattenDeep from 'lodash.flattendeep'
import union from 'lodash.union'

import Launcher from './launcher.js'

const log = logger('@wdio/cli:watch')

export default class Watcher {
    constructor (configFile, argv) {
        log.info('Starting launcher in watch mode')
        this.launcher = new Launcher(configFile, argv, true)
        this.argv = argv

        const specs = this.launcher.configParser.getSpecs()
        const capSpecs = this.launcher.isMultiremote ? [] : union(flattenDeep(
            this.launcher.configParser.getCapabilities().map(cap => cap.specs || [])
        ))
        this.specs = [...specs, ...capSpecs]
        this.isRunningTests = false
    }

    async watch () {
        /**
         * Listen on spec changes and rerun specific spec file
         */
        chokidar.watch(this.specs, { ignoreInitial: true })
            .on('add', this.getFileListener())
            .on('change', this.getFileListener())

        /**
         * Listen on filesToWatch changes and rerun complete suite
         */
        const { filesToWatch } = this.launcher.configParser.getConfig()
        if (filesToWatch.length) {
            chokidar.watch(filesToWatch, { ignoreInitial: true })
                .on('add', this.getFileListener(false))
                .on('change', this.getFileListener(false))
        }

        /**
         * Run initial test suite.
         */
        await this.launcher.run()

        /**
         * Clean interface once all workers are finished.
         */
        const workers = this.getWorkers()
        Object.values(workers).forEach((worker) => worker.on('exit', () => {
            /**
             * check if all workers have finished
             */
            if (Object.values(workers).find((w) => w.isBusy)) {
                return
            }

            this.launcher.interface.finalise()
        }))
    }

    /**
     * Return file listener callback that calls `run` method.
     * @param  {Boolean}  [passOnFile=true] - If true, pass on file change as parameter
     * @return {Function}                   - chokidar event callback
     */
    getFileListener (passOnFile = true) {
        return (spec) => this.run(
            Object.assign({}, this.argv, passOnFile ? { spec } : {})
        )
    }

    /**
     * Helper method to get workers from the worker pool of WDIO runner.
     * @param  {Function} pickBy             - Filter by property value (see lodash.pickBy)
     * @param  {Boolean}  includeBusyWorker  - Don't filter out busy worker (default: false)
     * @return {Object} - Object with workers, e.g. {'0-0': { ... }}
     */
    getWorkers (pickByFn, includeBusyWorker) {
        let workers = this.launcher.runner.workerPool

        if (typeof pickByFn === 'function') {
            workers = pickBy(workers, pickByFn)
        }

        /**
         * Filter out busy workers. Only skip if explicitly desired.
         */
        if (!includeBusyWorker) {
            workers = pickBy(workers, (worker) => !worker.isBusy)
        }

        return workers
    }

    /**
     * Run workers with params.
     * @param  {Object} [params={}] - Parameters to run the worker with
     */
    run (params = {}) {
        const workers = this.getWorkers(
            params.spec ? (worker) => worker.specs.includes(params.spec) : null)

        /**
         * do nothing if no workers are found
         */
        if (Object.keys(workers).length === 0) {
            return
        }

        /**
         * Update total worker count interface.
         * @TODO: This should have a cleaner solution
         */
        this.launcher.interface.totalWorkerCnt = Object.entries(workers).length

        /**
         * Clean up interface.
         */
        this.cleanUp()

        /**
         * Trigger new run for non-busy worker
         */
        for (const [, worker] of Object.entries(workers)) {
            const { cid, caps, specs, sessionId } = worker
            const argv = Object.assign({ sessionId }, params)
            worker.postMessage('run', argv)
            this.launcher.interface.emit('job:start', { cid, caps, specs })
        }
    }

    cleanUp () {
        this.launcher.interface.setup()
    }
}
