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
            .on('add', path => this.run(Object.assign({}, this.argv, { spec: path })))
            .on('change', path => this.run(Object.assign({}, this.argv, { spec: path })))

        /**
         * listen on filesToWatch changes an rerun complete suite
         */
        const { filesToWatch } = this.launcher.configParser.getConfig()
        if (filesToWatch.length) {
            chokidar.watch(filesToWatch, { ignoreInitial: true })
                .on('add', ::this.runAll)
                .on('change', ::this.runAll)
        }

        /**
         * run initial test suite
         */
        await this.launcher.run()
        this.launcher.interface.updateView()
    }

    runAll () {
        this.cleanUp()

        /**
         * update total worker count interface
         * ToDo: this should have a cleaner solution
         */
        this.launcher.interface.totalWorkerCnt = this.totalWorkerCnt

        /**
         * rerun every worker
         */
        for (const [, worker] of Object.entries(this.launcher.runner.workerPool)) {
            const { cid, caps, specs } = worker
            const argv = Object.assign({}, this.argv, { sessionId: worker.sessionId })
            worker.postMessage('run', argv)
            this.launcher.interface.emit('job:start', { cid, caps, specs })
        }
    }

    run (params) {
        /**
         * get worker containing same spec file
         */
        let workers = pickBy(
            this.launcher.runner.workerPool,
            (worker) => worker.specs.includes(params.spec)
        )

        /**
         * filter out busy workers
         */
        workers = pickBy(workers, (worker) => !worker.isBusy)

        /**
         * only clean up if new workers are being triggered
         */
        if (Object.keys(workers).length) {
            this.cleanUp()
        }

        /**
         * update total worker count interface
         * ToDo: this should have a cleaner solution
         */
        this.launcher.interface.totalWorkerCnt = Object.entries(workers).length

        /**
         * trigger new run for non busy worker
         */
        for (const [, worker] of Object.entries(workers)) {
            const { cid, caps, specs } = worker
            const argv = Object.assign(params, { sessionId: worker.sessionId })
            worker.postMessage('run', argv)
            this.launcher.interface.emit('job:start', { cid, caps, specs })
        }
    }

    cleanUp () {
        this.launcher.interface.setup()
        this.launcher.interface.updateView()
    }
}
