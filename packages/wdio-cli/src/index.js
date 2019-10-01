import fs from 'fs'
import process from 'process'
import path from 'path'

import yargs from 'yargs'

import Launcher from './launcher'
import { handler, builder } from './commands/run'

const SUPPORTED_COMMANDS = ['config', 'install', 'repl', 'run']
const DEFAULT_CONFIG_FILENAME = 'wdio.conf.js'

export const run = async () => {
    const argv = yargs
        .commandDir('commands')
        .help()

    /**
     * parse CLI arguments according to what run expects
     */
    for (const [name, param] of Object.entries(builder)) {
        argv.option(name, param)
    }

    /**
     * if yargs doesn't run a command from the command directory
     * we verify if a WDIO config file exists in the given "path" parameter
     * if so, we assume the user ran `wdio path/to/wdio.conf.js` and we execute `wdio run` command
     */
    const params = { ...argv.argv }
    if (!params._.find((param) => SUPPORTED_COMMANDS.includes(param))) {
        params.configPath = path.join(process.cwd(), params._[0] || DEFAULT_CONFIG_FILENAME)
        params._.push(fs.existsSync(params.configPath) ? 'run' : 'config')
        return handler(params)
    }
}

export default Launcher
