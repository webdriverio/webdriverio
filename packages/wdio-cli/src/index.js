import yargs from 'yargs'
import pickBy from 'lodash.pickby'

import { CLI_PARAMS, USAGE } from './config'
import Launcher from './launcher'
import runCLI from './run'

export const run = () => {
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

    /**
     * fail execution if more than one wdio config file was specified
     */
    if (params._.length > 1) {
        argv.showHelp()
        console.error(`More than one config file was specified: ${params._.join(', ')}`) // eslint-disable-line
        console.error('Error: You can only run one wdio config file!') // eslint-disable-line
        process.exit(1)
    }

    runCLI(params)
}

export default Launcher
