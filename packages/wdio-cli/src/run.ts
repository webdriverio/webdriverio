import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { commands } from './commands/index.js'
import { handler, cmdArgs } from './commands/run.js'
import { CLI_EPILOGUE, pkg } from './constants.js'
import type { RunCommandArguments } from './types.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

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
    'For more information, visit: https://webdriver.io/docs/clioptions'
]

export default async function run() {
    const commandDir = path.join(__dirname, 'commands')
    const argv = yargs(hideBin(process.argv))
        .command(commands)
        .example('wdio run wdio.conf.js --suite foobar', 'Run suite on testsuite "foobar"')
        .example('wdio run wdio.conf.js --spec ./tests/e2e/a.js --spec ./tests/e2e/b.js', 'Run suite on specific specs')
        .example('wdio run wdio.conf.js --spec ./tests/e2e/a.feature:5', 'Run scenario by line number')
        .example('wdio run wdio.conf.js --spec ./tests/e2e/a.feature:5:10', 'Run scenarios by line number')
        .example('wdio run wdio.conf.js --spec ./tests/e2e/a.feature:5:10 --spec ./test/e2e/b.feature', 'Run scenarios by line number in single feature and another complete feature')
        .example('wdio install reporter spec', 'Install @wdio/spec-reporter')
        .example('wdio repl chrome -u <SAUCE_USERNAME> -k <SAUCE_ACCESS_KEY>', 'Run repl in Sauce Labs cloud')
        .updateStrings({ 'Commands:': `${DESCRIPTION.join('\n')}\n\nCommands:` })
        .version(pkg.version)
        .epilogue(CLI_EPILOGUE)

    /**
     * parse CLI arguments according to what run expects, without this adding
     * `--spec ./test.js` results in propagating the spec parameter as a
     * string while in reality is should be parsed into a array of strings
     */
    if (!process.argv.find((arg) => arg === '--help')) {
        argv.options(cmdArgs)
    }

    /**
     * The only way we reach this point is if the user runs the binary without a command (i.e. wdio wdio.conf.js)
     * We can safely assume that if this is the case, the user is trying to execute the `run` command as it
     * was previous to https://github.com/webdriverio/webdriverio/pull/4402
     *
     * Since the `run` command verifies if the configuration file exists before executing
     * we don't have to check that again here.
     */
    const params = await argv.parse()
    const supportedCommands = fs
        .readdirSync(commandDir)
        .map((file) => file.slice(0, -3))

    if (!params._ || params._.find((param: string) => supportedCommands.includes(param))) {
        return
    }

    const args: RunCommandArguments = {
        ...params,
        configPath: path.resolve(process.cwd(), params._[0] && params._[0].toString() || DEFAULT_CONFIG_FILENAME)
    }

    try {
        const cp = await handler(args)
        return cp
    } catch (err: any) {
        const output = await new Promise((resolve) => (
            yargs(hideBin(process.argv)).parse('--help', (
                err: Error,
                argv: Record<string, any>,
                output: string
            ) => resolve(output)))
        )

        console.error(`${output}\n\n${err.stack}`)
        /* istanbul ignore if */
        if (!process.env.VITEST_WORKER_ID) {
            process.exit(1)
        }
    }
}
