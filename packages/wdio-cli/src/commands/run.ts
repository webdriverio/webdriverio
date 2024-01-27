import path from 'node:path'
import fs from 'node:fs/promises'
import { execa } from 'execa'
import type { Argv } from 'yargs'

import Launcher from '../launcher.js'
import Watcher from '../watcher.js'
import { formatConfigFilePaths, canAccessConfigPath, missingConfigurationPrompt } from './config.js'
import { CLI_EPILOGUE } from '../constants.js'
import type { RunCommandArguments } from '../types.js'

export const command = 'run <configPath>'

export const desc = 'Run your WDIO configuration file to initialize your tests. (default)'

const coerceOpts = (opts: { [x: string]: boolean | string | number }) => {
    for (const key in opts) {
        if (opts[key] === 'true') {
            opts[key] = true
        } else if (opts[key] === 'false') {
            opts[key] = false
        }
    }
    return opts
}

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
        desc: 'run only a certain spec file - overrides specs piped from stdin',
        type: 'array'
    },
    exclude: {
        desc: 'exclude certain spec file from the test run - overrides exclude piped from stdin',
        type: 'array'
    },
    'multi-run': {
        desc: 'Run individual spec files x amount of times',
        type: 'number'
    },
    mochaOpts: {
        desc: 'Mocha options',
        coerce: coerceOpts
    },
    jasmineOpts: {
        desc: 'Jasmine options',
        coerce: coerceOpts
    },
    cucumberOpts: {
        desc: 'Cucumber options',
        coerce: coerceOpts
    },
    autoCompileOpts: {
        desc: 'Auto compilation options'
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

enum NodeVersion {
    'major' = 0,
    'minor' = 1,
    'patch' = 2
}

function nodeVersion(type: keyof typeof NodeVersion): number {
    return process.versions.node.split('.').map(Number)[NodeVersion[type]]
}

export async function handler(argv: RunCommandArguments) {
    const { configPath = 'wdio.conf.js', ...params } = argv

    const wdioConf = await formatConfigFilePaths(configPath)
    const confAccess = await canAccessConfigPath(wdioConf.fullPathNoExtension)
    if (!confAccess) {
        try {
            await missingConfigurationPrompt('run', wdioConf.fullPathNoExtension)
        } catch {
            process.exit(1)
        }
    }

    /**
     * In order to load TypeScript files in ESM we need to apply the ts-node loader.
     * Let's have WebdriverIO set it automatically if the user doesn't.
     */
    const nodePath = process.argv[0]
    let NODE_OPTIONS = process.env.NODE_OPTIONS || ''
    const isTSFile = wdioConf.fullPath.endsWith('.ts') || wdioConf.fullPath.endsWith('.mts')
    const runsWithLoader = (
        Boolean(
            process.argv.find((arg) => arg.startsWith('--loader')) &&
            process.argv.find((arg) => arg.endsWith('ts-node/esm'))
        ) ||
        NODE_OPTIONS?.includes('ts-node/esm')
    )
    if (isTSFile && !runsWithLoader && nodePath) {
        NODE_OPTIONS += ' --loader ts-node/esm/transpile-only --no-warnings'
        if (nodeVersion('major') >= 20 || (nodeVersion('major') === 18 && nodeVersion('minor') >= 19)) {
            // Changes in Node 18.19 (and up) and Node 20 affect how TS Node works with source maps, hence the need for this workaround. See:
            // - https://github.com/webdriverio/webdriverio/issues/10901
            // - https://github.com/TypeStrong/ts-node/issues/2053
            NODE_OPTIONS += ' -r ts-node/register'
        }
        const tsNodeProjectFromEnvVar = process.env.TS_NODE_PROJECT &&
            path.resolve(process.cwd(), process.env.TS_NODE_PROJECT)
        const tsNodeProjectFromParams = params.autoCompileOpts?.tsNodeOpts?.project &&
            path.resolve(process.cwd(), params.autoCompileOpts?.tsNodeOpts?.project)
        const tsNodeProjectRelativeToWdioConfig = path.join(path.dirname(wdioConf.fullPath), 'tsconfig.json')
        if (tsNodeProjectFromParams) {
            console.log('Deprecated: use the TS_NODE_PROJECT environment variable instead')
        }
        const localTSConfigPath = (
            tsNodeProjectFromEnvVar ||
            tsNodeProjectFromParams ||
            tsNodeProjectRelativeToWdioConfig)
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
        const watcher = new Watcher(wdioConf.fullPath, params)
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
        return launch(wdioConf.fullPath, params)
    }

    /*
     * get a list of spec files to run from stdin, overriding any other
     * configuration suite or specs.
     */
    launchWithStdin(wdioConf.fullPath, params)
}
