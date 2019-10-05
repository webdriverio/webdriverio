import fs from 'fs'
import path from 'path'

import yargs from 'yargs'

import Launcher from './launcher'
import { handler } from './commands/run'
import { CLI_EPILOGUE } from './constants'

const DEFAULT_CONFIG_FILENAME = 'wdio.conf.js'
const DESCRIPTION = [
    'The `wdio` command allows you run and manage your WebdriverIO test suite.',
    'If no command is provided it calls the `run` command by default, so:',
    '',
    '$ wdio wdio.conf.js',
    '',
    'is the same as:',
    '$ wdio run wdio.conf.js',
    '',
    'For more information, visit: https://webdriver.io/docs/clioptions.html'
]

export const run = async () => {
    const argv = yargs
        .commandDir('commands')
        .example('$0 run wdio.conf.js --suite foobar', 'Run testsuite foobar')
        .example('$0 run wdio.conf.js --spec ./tests/e2e/a.js --spec ./tests/e2e/b.js', 'Run testsuite foobar')
        .example('$0 install reporter spec', 'Install @wdio/spec-reporter')
        .example('$0 repl chrome -u <SAUCE_USERNAME> -k <SAUCE_ACCESS_KEY>', 'Run repl in Sauce Labs cloud')
        .updateStrings({
            'Commands:': `${DESCRIPTION.join('\n')}\n\nCommands:`
        })
        .epilogue(CLI_EPILOGUE)

    /**
     * The only way we reach this point is if the user runs the binary without a command (i.e. wdio wdio.conf.js)
     * We can safely assume that if this is the case, the user is trying to execute the `run` command as it
     * was previous to https://github.com/webdriverio/webdriverio/pull/4402
     *
     * Since the `run` command verifies if the configuration file exists before executing
     * we don't have to check that again here.
     */
    const params = { ...argv.argv }
    const supportedCommands = fs
        .readdirSync(path.join(__dirname, 'commands'))
        .map((file) => file.slice(0, -3))

    if (!params._.find((param) => supportedCommands.includes(param))) {
        params.configPath = path.join(process.cwd(), params._[0] || DEFAULT_CONFIG_FILENAME)
        params._.push(fs.existsSync(params.configPath) ? 'run' : 'config')
        return handler(params).catch(async (err) => {
            const output = await new Promise((resolve) => {
                yargs.parse('--help', (err, argv, output) => resolve(output))
            })

            console.error(`${output}\n\n${err.stack}`)
            process.exit(1)
        })
    }

    return handler(params)
}

export default Launcher
