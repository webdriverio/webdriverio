import chokidar from 'chokidar'
import logger from '@wdio/logger'
import pickBy from 'lodash.pickby'
import flattenDeep from 'lodash.flattendeep'
import union from 'lodash.union'
import type { Capabilities, Workers } from '@wdio/types'

import Launcher from './launcher.js'
import type { RunCommandArguments, ValueKeyIteratee } from './types'

const log = logger('@wdio/cli:watch')

type Spec = string | string[]
export default class Watcher {
    private _launcher: Launcher
    private _specs: Spec[]

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
        let flattenedSpecs = flattenDeep(this._specs)
        chokidar.watch(flattenedSpecs, { ignoreInitial: true })
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
            const runSpecs: Spec[] = []
            let singleSpecFound: boolean = false
            for (let index = 0, length = this._specs.length; index < length; index += 1) {
                const value = this._specs[index]
                if (Array.isArray(value) && value.indexOf(spec) > -1) {
                    runSpecs.push(value)
                } else if ( !singleSpecFound && spec === value) {
                    // Only need to run a singleFile once  - so avoid duplicates
                    singleSpecFound = true
                    runSpecs.push(value)
                }
            }

            // If the runSpecs array is empty, then this must be a new file/array
            // so add the spec directly to the runSpecs
            if (runSpecs.length === 0) {
                runSpecs.push(spec)
            }

            // Do not pass the `spec` command line option to `this.run()`
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { spec: _specArg, ...args } = this._args
            return runSpecs.map((spec) => {
                return this.run({ ...args, ...(passOnFile ? { spec } : {}) })
            })
        }
    }

    /**
     * helper method to get workers from worker pool of wdio runner
     * @param  predicate         filter by property value (see lodash.pickBy)
     * @param  includeBusyWorker don't filter out busy worker (default: false)
     * @return                   Object with workers, e.g. {'0-0': { ... }}
     */
    getWorkers (predicate?: ValueKeyIteratee<Workers.Worker> | null | undefined, includeBusyWorker?: boolean): Workers.WorkerPool {
        if (!this._launcher.runner) {
            throw new Error('Internal Error: no runner initialised, call run() first')
        }

        let workers = this._launcher.runner.workerPool

        if (typeof predicate === 'function') {
            workers = pickBy(workers, predicate)
        }

        /**
         * filter out busy workers, only skip if explicitly desired
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
    run (params: Omit<Partial<RunCommandArguments>, 'spec'> & { spec?: Spec } = {}) {
        const workers = this.getWorkers(
            (params.spec ? (worker) => {
                if (Array.isArray(params.spec)) {
                    return params.spec === worker.specs
                }
                return worker.specs.includes(params.spec!)
            } : undefined)
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
