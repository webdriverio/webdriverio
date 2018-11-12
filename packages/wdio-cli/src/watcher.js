import chokidar from 'chokidar'
import logger from '@wdio/logger'
import pickBy from 'lodash.pickby'
import flattenDeep from 'lodash.flattendeep'

import Launcher from './launcher.js'

const log = logger('wdio-cli:watch')

export default class Watcher {
    constructor (configFile, argv) {
        log.info('Starting launcher in watch mode')
        this.launcher = new Launcher(configFile, argv)
        this.argv = argv
        this.specs = [
            ...this.launcher.configParser.getSpecs(),
            ...flattenDeep(this.launcher.configParser.getCapabilities().map(cap => cap.specs || []))
        ]
        this.isRunningTests = false
    }

    async watch () {
        chokidar.watch(this.specs, { ignoreInitial: true })
            .on('add', path => this.run(Object.assign({}, this.argv, { spec: path })))
            .on('change', path => this.run(Object.assign({}, this.argv, { spec: path })))

        /**
         * run initial test suite
         */
        await this.launcher.run()
        this.launcher.interface.updateView()
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
