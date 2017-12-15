import fs from 'fs'
import yargs from 'yargs'

import { CLI_PARAMS, USAGE } from './config'
import run from './run'
import setup from './setup'

let argv = yargs
    .usage(USAGE)
    .commandDir('commands')

/**
 * populate cli arguments
 */
for (const param of CLI_PARAMS) {
    argv = argv.option(param.name, param)
}

const params = argv.argv
let wdioConf = params._[0] || (fs.existsSync('./wdio.conf.js') ? 'wdio.conf.js' : null)

/**
 * use wdio.conf.js default file name if no config was specified
 * otherwise run config sequenz
 */
if (wdioConf) {
    run(wdioConf, params)
} else {
    setup()
}
