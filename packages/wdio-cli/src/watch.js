import chokidar from 'chokidar'
import logger from 'wdio-logger'
import { ConfigParser } from 'wdio-config'

import Launcher from './launcher.js'

const log = logger('wdio-cli:watch')

function launch (wdioConf, params) {
    log.debug('Run suite with config', wdioConf, 'and params', params)
    let launcher = new Launcher(wdioConf, params)
    launcher.run().then(
        () => launcher.interface.log('\nWaiting for files to change...'))
}

export default function watch (configFile, argv) {
    log.info('Starting launcher in watch mode')

    const configParser = new ConfigParser()
    configParser.addConfigFile(configFile)
    configParser.merge(argv)

    const specs = configParser.getSpecs()
    chokidar.watch(specs)
        .on('add', path => launch(configFile, Object.assign(argv, { spec: path })))
        .on('change', path => launch(configFile, Object.assign(argv, { spec: path })))
}
