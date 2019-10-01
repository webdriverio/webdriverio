import fs from 'fs'
import process from 'process'
import path from 'path'

import yargs from 'yargs'

import Launcher from './launcher'
import { handler } from './commands/run'

export const run = async () => {
    const argv = yargs
        .commandDir('commands')
        .help()

    /**
     * if yargs doesn't run a command from the command directory
     * we verify if a WDIO config file exists in the given "path" parameter
     * if so, we assume the user ran `wdio path/to/wdio.conf.js` and we execute `wdio run` command
     */
    const params = { ...argv.argv }
    if (argv.argv._.length === 0) {
        const wdioConfPath = path.join(process.cwd(), params._[0])
        const isConfigExisting = fs.existsSync(wdioConfPath)
        params.argv._.push(isConfigExisting ? 'run' : 'config')
        return handler(params)
    }
}

export default Launcher
