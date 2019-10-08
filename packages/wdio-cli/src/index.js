import fs from 'fs'
import process from 'process'
import path from 'path'

import yargs from 'yargs'

import Launcher from './launcher'
import { handler, cmdArgs } from './commands/run'
import { CLI_EPILOGUE } from './constants'

const SUPPORTED_COMMANDS = ['config', 'install', 'repl', 'run']
const DEFAULT_CONFIG_FILENAME = 'wdio.conf.js'

export const run = async () => {
    const argv = yargs
        .commandDir('commands')
        .example('$0 run wdio.conf.js --suite foobar', 'Run testsuite foobar')
        .example('$0 run wdio.conf.js --spec ./tests/e2e/a.js --spec ./tests/e2e/b.js', 'Run testsuite foobar')
        .example('$0 install reporter spec', 'Install @wdio/spec-reporter')
        .example('$0 repl chrome -u <SAUCE_USERNAME> -k <SAUCE_ACCESS_KEY>', 'Run repl in Sauce Labs cloud')
        .epilogue(CLI_EPILOGUE)
        .help()

    /**
     * parse CLI arguments according to what run expects
     */
    if (!process.argv.find((arg) => arg === '--help')) {
        yargs.options(cmdArgs)
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
