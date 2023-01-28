import path from 'node:path'
import fs from 'node:fs/promises'
import { execa } from 'execa'
import type { Argv } from 'yargs'

import Launcher from '../launcher.js'
import Watcher from '../watcher.js'
import { missingConfigurationPrompt } from './config.js'
import { CLI_EPILOGUE } from '../constants.js'
import type { RunCommandArguments } from '../types.js'

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
        desc: 'run only a certain spec file - overrides specs piped from stdin',
        type: 'array'
    },
    exclude: {
        desc: 'exclude certain spec file from the test run - overrides exclude piped from stdin',
        type: 'array'
    },
    mochaOpts: {
        desc: 'Mocha options'
    },
    jasmineOpts: {
        desc: 'Jasmine options'
    },
    cucumberOpts: {
        desc: 'Cucumber options'
    },
    autoCompileOpts: {
        desc: 'Auto compilation options'
    },
    coverage: {
        desc: 'Enable coverage for browser runner'
    }
} as const

export const builder = (yargs: Argv) => {
    return yargs
        .options(cmdArgs)
        .example('$0 run wdio.conf.js --suite foobar', 'Run suite on testsuite "foobar"')
        .example('$0 run wdio.conf.js --spec ./tests/e2e/a.js --spec ./tests/e2e/b.js', 'Run suite on specific specs')
        .example('$0 run wdio.conf.js --mochaOpts.timeout 60000', 'Run suite with custom Mocha timeout')
        .example('$0 run wdio.conf.js --autoCompileOpts.autoCompile=false', 'Disable auto-loading of ts-node or @babel/register')
        .example('$0 run wdio.conf.js --autoCompileOpts.tsNodeOpts.project=./configs/bdd-tsconfig.json', 'Run suite with ts-node using custom tsconfig.json')
        .epilogue(CLI_EPILOGUE)
        .help()
}

export function launchWithStdin(wdioConfPath: string, params: Partial<RunCommandArguments>) {
    let stdinData = ''
    const stdin = process.openStdin()

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
            if (!process.env.VITEST_WORKER_ID) {
                process.exit(...args)
            }
        })
        .catch(err => {
            console.error(err)
            /* istanbul ignore if */
            if (!process.env.VITEST_WORKER_ID) {
                process.exit(1)
            }
        })
}

export async function handler(argv: RunCommandArguments) {
    const { configPath, ...params } = argv

    const canAccessConfigPath = await fs.access(configPath).then(
        () => true,
        () => false
    )
    if (!canAccessConfigPath) {
        const configFullPath = path.join(process.cwd(), configPath)
        await missingConfigurationPrompt('run', configFullPath)
    }

    const localConf = path.join(process.cwd(), 'wdio.conf.js')
    const wdioConf = configPath || ((await fs.access(localConf).then(() => true, () => false))
        ? localConf
        : undefined
    ) as string

    /**
     * In order to load TypeScript files in ESM we need to apply the ts-node loader.
     * Let's have WebdriverIO set it automatically if the user doesn't.
     */
    const nodePath = process.argv[0]
    let NODE_OPTIONS = process.env.NODE_OPTIONS || ''
    const runsWithLoader = (
        Boolean(
            process.argv.find((arg) => arg.startsWith('--loader')) &&
            process.argv.find((arg) => arg.endsWith('ts-node/esm'))
        ) ||
        NODE_OPTIONS?.includes('ts-node/esm')
    )
    if (wdioConf.endsWith('.ts') && !runsWithLoader && nodePath) {
        NODE_OPTIONS += ' --loader ts-node/esm/transpile-only --no-warnings'
        const localTSConfigPath = (
            (
                params.autoCompileOpts?.tsNodeOpts?.project &&
                path.resolve(process.cwd(), params.autoCompileOpts?.tsNodeOpts?.project)
            ) ||
            path.join(path.dirname(wdioConf), 'tsconfig.json')
        )
        const hasLocalTSConfig = await fs.access(localTSConfigPath).then(() => true, () => false)
        const p = await execa(nodePath, process.argv.slice(1), {
            reject: false,
            cwd: process.cwd(),
            stdio: 'inherit',
            env: {
                ...process.env,
                ...(hasLocalTSConfig ? { TS_NODE_PROJECT: localTSConfigPath } : {}),
                NODE_OPTIONS
            }
        })
        return !process.env.VITEST_WORKER_ID && process.exit(p.exitCode)
    }

    /**
     * if `--watch` param is set, run launcher in watch mode
     */
    if (params.watch) {
        const watcher = new Watcher(wdioConf, params)
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
        return launch(wdioConf, params)
    }

    /*
     * get a list of spec files to run from stdin, overriding any other
     * configuration suite or specs.
     */
    launchWithStdin(wdioConf, params)
}
