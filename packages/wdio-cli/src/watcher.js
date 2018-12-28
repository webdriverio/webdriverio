import chokidar from 'chokidar'
import logger from '@wdio/logger'
import pickBy from 'lodash.pickby'
import flattenDeep from 'lodash.flattendeep'
import union from 'lodash.union'

import Launcher from './launcher.js'

const log = logger('wdio-cli:watch')


export default class Watcher {
    constructor (configFile, argv) {
        log.info('Starting launcher in watch mode')
        this.launcher = new Launcher(configFile, argv)
        this.totalWorkerCnt = this.launcher.interface.totalWorkerCnt
        this.argv = argv

        const specs = this.launcher.configParser.getSpecs()
        this.specs = [
            ...specs,
            ...union(flattenDeep(
                this.launcher.configParser.getCapabilities().map(cap => cap.specs || [])
            ))
        ]
        this.isRunningTests = false
    }

    async watch () {
        /**
         * listen on spec changes and rerun specific spec file
         */
        chokidar.watch(this.specs, { ignoreInitial: true })
            .on('add', this.getFileListener())
            .on('change', this.getFileListener())

        /**
         * listen on filesToWatch changes an rerun complete suite
         */
        const { filesToWatch } = this.launcher.configParser.getConfig()
        if (filesToWatch.length) {
            chokidar.watch(filesToWatch, { ignoreInitial: true })
                .on('add', this.getFileListener(false))
                .on('change', this.getFileListener(false))
        }

        /**
         * run initial test suite
         */
        await this.launcher.run()
        this.launcher.interface.updateView()
    }

    /**
     * return file listener callback that calls `run` method
     * @param  {Boolean}  [passOnFile=true]  if true pass on file change as parameter
     * @return {Function}                    chokidar event callback
     */
    getFileListener (passOnFile = true) {
        return (spec) => this.run(
            Object.assign({}, this.argv, passOnFile ? { spec } : {})
        )
    }

    /**
     * helper method to get workers from worker pool of wdio runner
     * @param  {Function} pickBy             filter by property value (see lodash.pickBy)
     * @param  {Boolean}  includeBusyWorker  don't filter out busy worker (default: false)
     * @return {Object}                      Object with workers, e.g. {'0-0': { ... }}
     */
    getWorkers (pickByFn, includeBusyWorker) {
        let workers = this.launcher.runner.workerPool

        if (typeof pickByFn === 'function') {
            workers = pickBy(workers, pickByFn)
        }

        /**
         * filter out busy workers, only skip if explicitely desired
         */
        if (!includeBusyWorker) {
            workers = pickBy(workers, (worker) => !worker.isBusy)
        }

        return workers
    }

    /**
     * run workers with params
     * @param  {Object} [params={}]  parameters to run the worker with
     */
    run (params = {}) {
        const workers = this.getWorkers(
            params.spec ? (worker) => worker.specs.includes(params.spec) : null)

        /**
         * don't do anything if no worker was found
         */
        if (Object.keys(workers).length === 0) {
            return
        }

        /**
         * clean up interface
         */
        this.cleanUp()

        /**
         * update total worker count interface
         * ToDo: this should have a cleaner solution
         */
        this.launcher.interface.totalWorkerCnt = Object.entries(workers).length

        /**
         * trigger new run for non busy worker
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
        this.launcher.interface.updateView()
    }
}
