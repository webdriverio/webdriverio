import fs from 'node:fs/promises'
import path from 'node:path'

import type { Argv } from 'yargs'

import Launcher from '../launcher.js'
import Watcher from '../watcher.js'
import { coerceOptsFor,  } from '../utils.js'
import { CLI_EPILOGUE } from '../constants.js'
import type { RunCommandArguments } from '../types.js'
import { config } from 'create-wdio/config/cli'
import duration from '../duration.js'

export const command = 'run <configPath>'

export const desc = 'Run your WDIO configuration file to initialize your tests. (default)'

export const cmdArgs = {
    watch: {
        desc: 'Run WebdriverIO in watch mode',
        type: 'boolean',
    },
    hostname: {
        alias: 'h',
        desc: 'automation driver host address',
        type: 'string'
    },
    port: {
        alias: 'p',
        desc: 'automation driver port',
        type: 'number'
    },
    path: {
        type: 'string',
        desc: 'path to WebDriver endpoints (default "/")'
    },
    user: {
        alias: 'u',
        desc: 'username if using a cloud service as automation backend',
        type: 'string'
    },
    key: {
        alias: 'k',
        desc: 'corresponding access key to the user',
        type: 'string'
    },
    logLevel: {
        alias: 'l',
        desc: 'level of logging verbosity',
        choices: ['trace', 'debug', 'info', 'warn', 'error', 'silent']
    },
    bail: {
        desc: 'stop test runner after specific amount of tests have failed',
        type: 'number'
    },
    baseUrl: {
        desc: 'shorten url command calls by setting a base url',
        type: 'string'
    },
    waitforTimeout: {
        alias: 'w',
        desc: 'timeout for all waitForXXX commands',
        type: 'number'
    },
    updateSnapshots: {
        alias: 's',
        desc: 'update DOM, image or test snapshots',
        type: 'string',
        coerce: (value: string) => {
            if (value === '') {
                return 'all'
            }
            return value
        }
    },
    framework: {
        alias: 'f',
        desc: 'defines the framework (Mocha, Jasmine or Cucumber) to run the specs',
        type: 'string'
    },
    reporters: {
        alias: 'r',
        desc: 'reporters to print out the results on stdout',
        type: 'array'
    },
    suite: {
        desc: 'overwrites the specs attribute and runs the defined suite',
        type: 'array'
    },
    spec: {
        desc: 'run only a certain spec file or wildcard - overrides specs piped from stdin',
        type: 'array'
    },
    exclude: {
        desc: 'exclude certain spec file or wildcard from the test run - overrides exclude piped from stdin',
        type: 'array'
    },
    'repeat': {
        desc: 'Repeat specific specs and/or suites N times',
        type: 'number'
    },
    mochaOpts: {
        desc: 'Mocha options',
        coerce: coerceOptsFor('mocha')
    },
    jasmineOpts: {
        desc: 'Jasmine options',
        coerce: coerceOptsFor('jasmine')
    },
    cucumberOpts: {
        desc: 'Cucumber options',
        coerce: coerceOptsFor('cucumber')
    },
    coverage: {
        desc: 'Enable coverage for browser runner'
    },
    shard: {
        desc: 'Shard tests and execute only the selected shard. Specify in the one-based form like `--shard x/y`, where x is the current and y the total shard.',
        coerce: (shard: string) => {
            const [current, total] = shard.split('/').map(Number)
            if (Number.isNaN(current) || Number.isNaN(total)) {
                throw new Error('Shard parameter must be in the form `x/y`, where x and y are positive integers.')
            }
            return { current, total }
        }
    }
} as const

export const builder = (yargs: Argv) => {
    return yargs
        .options(cmdArgs)
        .example('$0 run wdio.conf.js --suite foobar', 'Run suite on testsuite "foobar"')
        .example('$0 run wdio.conf.js --spec ./tests/e2e/a.js --spec ./tests/e2e/b.js', 'Run suite on specific specs')
        .example('$0 run wdio.conf.js --shard 1/4', 'Run only the first shard of 4 shards')
        .example('$0 run wdio.conf.js --mochaOpts.timeout 60000', 'Run suite with custom Mocha timeout')
        .example('$0 run wdio.conf.js --tsConfigPath=./configs/bdd-tsconfig.json', 'Run suite with tsx using custom tsconfig.json')
        .epilogue(CLI_EPILOGUE)
        .help()
}

export function launchWithStdin(wdioConfPath: string, params: Partial<RunCommandArguments>) {
    let stdinData = ''
    process.stdin.resume()
    const stdin = process.stdin

    stdin.setEncoding('utf8')
    stdin.on('data', (data) => {
        stdinData += data
    })
    stdin.on('end', () => {
        if (stdinData.length > 0) {
            params.spec = stdinData.trim().split(/\r?\n/)
        }
        launch(wdioConfPath, params)
    })
}

export async function launch(wdioConfPath: string, params: Partial<RunCommandArguments>) {
    const launcher = new Launcher(wdioConfPath, params)
    return launcher.run()
        .then((...args) => {
            /* istanbul ignore if */
            if (!process.env.WDIO_UNIT_TESTS) {
                process.exit(...args)
            }
        })
        .catch(err => {
            console.error(err)
            /* istanbul ignore if */
            if (!process.env.WDIO_UNIT_TESTS) {
                process.exit(1)
            }
        })
}

export async function handler(argv: RunCommandArguments) {
    const { configPath = 'wdio.conf.js', ...params } = argv

    duration.start('setup')

    const wdioConf = await config.formatConfigFilePaths(configPath)
    const confAccess = await config.canAccessConfigPath(wdioConf.fullPathNoExtension, wdioConf.fullPath)
    if (!confAccess) {
        try {
            await config.missingConfigurationPrompt('run', wdioConf.fullPathNoExtension)
            if (process.env.WDIO_UNIT_TESTS) {
                return
            }

            return handler(argv)
        } catch {
            process.exit(1)
        }
    }

    /**
     * In order to support custom tsconfig path option we have to check here whether a custom path
     * path was provided and set the `TSX_TSCONFIG_PATH` environment variable accordingly. In a later
     * step within the Launcher we will then load tsx with the custom tsconfig path.
     */
    const tsConfigPathFromEnvVar = (
        process.env.TSCONFIG_PATH && path.resolve(process.cwd(), process.env.TSCONFIG_PATH)
    ) || (
        process.env.TSX_TSCONFIG_PATH && path.resolve(process.cwd(), process.env.TSX_TSCONFIG_PATH)
    )
    const tsConfigPathFromParams = params.tsConfigPath && path.resolve(process.cwd(), params.tsConfigPath)
    const tsConfigPathRelativeToWdioConfig = path.join(path.dirname(confAccess), 'tsconfig.json')
    const localTSConfigPath = (
        tsConfigPathFromEnvVar ||
        tsConfigPathFromParams ||
        tsConfigPathRelativeToWdioConfig
    )
    const hasLocalTSConfig = await fs.access(localTSConfigPath).then(() => true, () => false)
    if (hasLocalTSConfig) {
        process.env.TSX_TSCONFIG_PATH = localTSConfigPath
    }

    /**
     * if `--watch` param is set, run launcher in watch mode
     */
    if (params.watch) {
        const watcher = new Watcher(confAccess, params)
        return watcher.watch()
    }

    /**
     * if stdin.isTTY, then no piped input is present and launcher should be
     * called immediately, otherwise piped input is processed, expecting
     * a list of files to process.
     *
     * stdin.isTTY is false when command is from nodes spawn since it's treated as a pipe
     */
    if (process.stdin.isTTY || !process.stdout.isTTY) {
        return launch(confAccess, params)
    }

    /*
     * get a list of spec files to run from stdin, overriding any other
     * configuration suite or specs.
     */
    launchWithStdin(confAccess, params)
}
