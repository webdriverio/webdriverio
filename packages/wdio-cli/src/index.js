import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import pickBy from 'lodash.pickby'

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

const params = pickBy(argv.argv)
const localConf = path.join(process.cwd(), 'wdio.conf.js')
const wdioConf = params._[0] || (fs.existsSync(localConf) ? localConf : null)

/**
 * use wdio.conf.js default file name if no config was specified
 * otherwise run config sequenz
 */
if (wdioConf) {
    run(wdioConf, params)
} else {
    setup()
}
