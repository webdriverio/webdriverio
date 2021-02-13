import chokidar from 'chokidar'
import logger from '@wdio/logger'
import pickBy from 'lodash.pickby'
import flattenDeep from 'lodash.flattendeep'
import union from 'lodash.union'

import Launcher from './launcher'
import type { Capabilities, Workers } from '@wdio/types'
import { RunCommandArguments, ValueKeyIteratee } from './types.js'

const log = logger('@wdio/cli:watch')

export default class Watcher {
    private _launcher: Launcher
    private _specs: string[]

    constructor (
        private _configFile: string,
        private _args: Omit<RunCommandArguments, 'configPath'>
    ) {
        log.info('Starting launcher in watch mode')
        this._launcher = new Launcher(this._configFile, this._args, true)

        const specs = this._launcher.configParser.getSpecs()
        const capSpecs = this._launcher.isMultiremote ? [] : union(flattenDeep(
            (this._launcher.configParser.getCapabilities() as Capabilities.DesiredCapabilities[]).map(cap => cap.specs || [])
        ))
        this._specs = [...specs, ...capSpecs]
    }

    async watch () {
        /**
         * listen on spec changes and rerun specific spec file
         */
        chokidar.watch(this._specs, { ignoreInitial: true })
            .on('add', this.getFileListener())
            .on('change', this.getFileListener())

        /**
         * listen on filesToWatch changes an rerun complete suite
         */
        const { filesToWatch } = this._launcher.configParser.getConfig()
        if (filesToWatch.length) {
            chokidar.watch(filesToWatch, { ignoreInitial: true })
                .on('add', this.getFileListener(false))
                .on('change', this.getFileListener(false))
        }

        /**
         * run initial test suite
         */
        await this._launcher.run()

        /**
         * clean interface once all worker finish
         */
        const workers = this.getWorkers()
        Object.values(workers).forEach((worker) => worker.on('exit', () => {
            /**
             * check if all workers have finished
             */
            if (Object.values(workers).find((w) => w.isBusy)) {
                return
            }

            this._launcher.interface.finalise()
        }))
    }

    /**
     * return file listener callback that calls `run` method
     * @param  {Boolean}  [passOnFile=true]  if true pass on file change as parameter
     * @return {Function}                    chokidar event callback
     */
    getFileListener (passOnFile = true) {
        return (spec: string) => {
            // Do not pass the `spec` command line option to `this.run()`
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { spec: _specArg, ...args } = this._args
            return this.run({ ...args, ...(passOnFile ? { spec } : {}) })
        }
    }

    /**
     * helper method to get workers from worker pool of wdio runner
     * @param  predicate         filter by property value (see lodash.pickBy)
     * @param  includeBusyWorker don't filter out busy worker (default: false)
     * @return                   Object with workers, e.g. {'0-0': { ... }}
     */
    getWorkers (predicate?: ValueKeyIteratee<Workers.Worker> | null | undefined, includeBusyWorker?: boolean): Workers.WorkerPool {
        let workers = this._launcher.runner.workerPool

        if (typeof predicate === 'function') {
            workers = pickBy(workers, predicate)
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
     * @param  params parameters to run the worker with
     */
    run (params: Omit<Partial<RunCommandArguments>, 'spec'> & { spec?: string } = {}) {
        const workers = this.getWorkers(
            (params.spec ? (worker) => worker.specs.includes(params.spec!) : undefined)
        )

        /**
         * don't do anything if no worker was found
         */
        if (Object.keys(workers).length === 0) {
            return
        }

        /**
         * update total worker count interface
         * ToDo: this should have a cleaner solution
         */
        this._launcher.interface.totalWorkerCnt = Object.entries(workers).length

        /**
         * clean up interface
         */
        this.cleanUp()

        /**
         * trigger new run for non busy worker
         */
        for (const [, worker] of Object.entries(workers)) {
            const { cid, caps, specs, sessionId } = worker
            const args = Object.assign({ sessionId }, params)
            worker.postMessage('run', args)
            this._launcher.interface.emit('job:start', { cid, caps, specs })
        }
    }

    cleanUp () {
        this._launcher.interface.setup()
    }
}
