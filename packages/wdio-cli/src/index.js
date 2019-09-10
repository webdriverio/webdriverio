import fs from 'fs'
import process from 'process'
import path from 'path'

import yargs from 'yargs'

import Launcher from './launcher'
import { handler } from './commands/run'

export const run = async () => {
    const argv = yargs
        .commandDir('commands')
        .demandCommand()
        .help()

    /**
     * if yargs doesn't run a command from the command directory
     * we verify if a WDIO config file exists in the given "path" parameter
     * if so, we assume the user ran `wdio path/to/wdio.conf.js` and we execute `wdio run` command
     */
    const params = { ...argv.argv }
    const wdioConfPath = path.join(process.cwd(), params._[0])
    const wdioConf = fs.existsSync(wdioConfPath)

    if (wdioConf) {
        console.warn('Running `wdio path/to/wdio.conf.js` is deprecated and will be removed in the next major release. Please use `wdio run path/to/wdio.conf.js`.')
        // run configuration
        try {
            await handler({ configPath: wdioConfPath, ...params })
        } catch {
            // silence exec error logging
            process.exit(1)
        }
    }
}

export default Launcher
