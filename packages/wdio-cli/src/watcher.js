import chokidar from 'chokidar'
import logger from '@wdio/logger'
import flattenDeep from 'lodash.flattendeep'

import Launcher from './launcher.js'

const log = logger('wdio-cli:watch')

export default class Watcher {
    constructor (configFile, argv) {
        log.info('Starting launcher in watch mode')
        this.launcher = new Launcher(configFile, argv)
        this.launcher.runner.on('message', ::this.handleRunnerMessages)
        const specs = [
            ...this.launcher.configParser.getSpecs(),
            ...flattenDeep(this.launcher.configParser.getCapabilities().map(cap => cap.specs || []))
        ]

        chokidar.watch(specs)
            .on('add', path => this.watch(configFile, Object.assign(argv, { spec: path })))
            .on('change', path => this.watch(configFile, Object.assign(argv, { spec: path })))
    }

    watch () {
        this.launcher.run()
    }

    handleRunnerMessages (...args) {
        console.log(args)
    }
}
