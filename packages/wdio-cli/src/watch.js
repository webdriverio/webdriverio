import chokidar from 'chokidar'
import logger from 'wdio-logger'
import { ConfigParser } from 'wdio-config'

// import Launcher from './launcher.js'

const log = logger('wdio-cli:watch')

// function launch (wdioConf, params) {
//     log.debug('Run suite with config', wdioConf, 'and params', params)
//     let launcher = new Launcher(wdioConf, params)
//     launcher.run().then(
//         (code) => process.exit(code),
//         (e) => process.nextTick(() => { throw e }))
// }

export default function watch (configFile, argv) {
    log.info('Starting launcher in watch mode')

    const configParser = new ConfigParser()
    configParser.addConfigFile(configFile)
    configParser.merge(argv)

    const specs = configParser.getSpecs()
    const config = configParser.getConfig()
    chokidar.watch(specs)
        .on('add', path => log.info(`File ${path} has been added`))
        .on('change', path => log.info(`File ${path} has been changed`))
}
