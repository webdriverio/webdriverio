import module from 'node:module'
import { HOOK_DEFINITION } from '@wdio/utils'
import type { Options, Services, Reporters } from '@wdio/types'

const require = module.createRequire(import.meta.url)
const pkgJSON = require('../package.json')

export const pkg = pkgJSON
export const CLI_EPILOGUE = `Documentation: https://webdriver.io\n@wdio/cli (v${pkg.version})`

export const SUPPORTED_COMMANDS = ['run', 'install', 'config', 'repl']

export const ANDROID_CONFIG = {
    platformName: 'Android',
    automationName: 'UiAutomator2',
    deviceName: 'Test'
}

export const IOS_CONFIG = {
    platformName: 'iOS',
    automationName: 'XCUITest',
    deviceName: 'iPhone Simulator'
}
const SUPPORTED_SNAPSHOTSTATE_OPTIONS = ['all', 'new', 'none'] as const

export const TESTRUNNER_DEFAULTS: Options.Definition<Options.Testrunner & { capabilities: unknown }> = {
    /**
     * Define specs for test execution. You can either specify a glob
     * pattern to match multiple files at once or wrap a glob or set of
     * paths into an array to run them within a single worker process.
     */
    specs: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "specs" option needs to be a list of strings')
            }
        }
    },
    /**
     * exclude specs from test execution
     */
    exclude: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "exclude" option needs to be a list of strings')
            }
        }
    },
    /**
     * key/value definition of suites (named by key) and a list of specs as value
     * to specify a specific set of tests to execute
     */
    suites: {
        type: 'object'
    },
    /**
     * Project root directory path.
     */
    rootDir: {
        type: 'string'
    },
    /**
     * If you only want to run your tests until a specific amount of tests have failed use
     * bail (default is 0 - don't bail, run all tests).
     */
    bail: {
        type: 'number',
        default: 0
    },
    /**
     * supported test framework by wdio testrunner
     */
    framework: {
        type: 'string'
    },
    /**
     * capabilities of WebDriver sessions
     */
    capabilities: {
        type: 'object',
        validate: (param: unknown) => {
            /**
             * should be an object
             */
            if (!Array.isArray(param)) {
                if (typeof param === 'object') {
                    return true
                }

                throw new Error('the "capabilities" options needs to be an object or a list of objects')
            }

            /**
             * or an array of objects
             */
            for (const option of param) {
                if (typeof option === 'object') { // Check does not work recursively
                    continue
                }

                throw new Error('expected every item of a list of capabilities to be of type object')
            }

            return true
        },
        required: true
    },
    /**
     * list of reporters to use, a reporter can be either a string or an object with
     * reporter options, e.g.:
     * [
     *  'dot',
     *  {
     *    name: 'spec',
     *    outputDir: __dirname + '/reports'
     *  }
     * ]
     */
    reporters: {
        type: 'object',
        validate: (param: Reporters.ReporterEntry[]) => {
            /**
             * option must be an array
             */
            if (!Array.isArray(param)) {
                throw new Error('the "reporters" options needs to be a list of strings')
            }

            const isValidReporter = (option: string | Function) => (
                (typeof option === 'string') ||
                (typeof option === 'function')
            )

            /**
             * array elements must be:
             */
            for (const option of param) {
                /**
                 * either a string or a function (custom reporter)
                 */
                if (isValidReporter(option as string)) {
                    continue
                }

                /**
                 * or an array with the name of the reporter as first element and the options
                 * as second element
                 */
                if (
                    Array.isArray(option) &&
                    typeof option[1] === 'object' &&
                    isValidReporter(option[0])
                ) {
                    continue
                }

                throw new Error(
                    'a reporter should be either a string in the format "wdio-<reportername>-reporter" ' +
                    'or a function/class. Please see the docs for more information on custom reporters ' +
                    '(https://webdriver.io/docs/customreporter)'
                )
            }

            return true
        }
    },
    /**
     * set of WDIO services to use
     */
    services: {
        type: 'object',
        validate: (param: Services.ServiceEntry[]) => {
            /**
             * should be an array
             */
            if (!Array.isArray(param)) {
                throw new Error('the "services" options needs to be a list of strings and/or arrays')
            }

            /**
             * with arrays and/or strings
             */
            for (const option of param) {
                if (!Array.isArray(option)) {
                    if (typeof option === 'string') {
                        continue
                    }
                    throw new Error('the "services" options needs to be a list of strings and/or arrays')
                }
            }

            return true
        },
        default: []
    },
    /**
     * Node arguments to specify when launching child processes
     */
    execArgv: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "execArgv" options needs to be a list of strings')
            }
        },
        default: []
    },
    /**
     * amount of instances to be allowed to run in total
     */
    maxInstances: {
        type: 'number'
    },
    /**
     * amount of instances to be allowed to run per capability
     */
    maxInstancesPerCapability: {
        type: 'number'
    },
    /**
     * whether or not testrunner should inject `browser`, `$` and `$$` as
     * global environment variables
     */
    injectGlobals: {
        type: 'boolean'
    },
    /**
     * Set to true if you want to update your snapshots.
     */
    updateSnapshots: {
        type: 'string',
        default: SUPPORTED_SNAPSHOTSTATE_OPTIONS[1],
        validate: (param: Options.Testrunner['updateSnapshots']) => {
            if (param && !SUPPORTED_SNAPSHOTSTATE_OPTIONS.includes(param)) {
                throw new Error(`the "updateSnapshots" options needs to be one of "${SUPPORTED_SNAPSHOTSTATE_OPTIONS.join('", "')}"`)
            }
        }
    },
    /**
     * Overrides default snapshot path. For example, to store snapshots next to test files.
     */
    resolveSnapshotPath: {
        type: 'function',
        validate: (param: Options.Testrunner['resolveSnapshotPath']) => {
            if (param && typeof param !== 'function') {
                throw new Error('the "resolveSnapshotPath" options needs to be a function')
            }
        }
    },
    /**
     * The number of times to retry the entire specfile when it fails as a whole
     */
    specFileRetries: {
        type: 'number',
        default: 0
    },
    /**
     * Delay in seconds between the spec file retry attempts
     */
    specFileRetriesDelay: {
        type: 'number',
        default: 0
    },
    /**
     * Whether or not retried spec files should be retried immediately or deferred to the end of the queue
     */
    specFileRetriesDeferred: {
        type: 'boolean',
        default: true
    },
    /**
     * whether or not print the log output grouped by test files
     */
    groupLogsByTestSpec: {
        type: 'boolean',
        default: false
    },
    /**
     * list of strings to watch of `wdio` command is called with `--watch` flag
     */
    filesToWatch: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "filesToWatch" option needs to be a list of strings')
            }
        }
    },
    shard: {
        type: 'object',
        validate: (param: unknown) => {
            if (typeof param !== 'object') {
                throw new Error('the "shard" options needs to be an object')
            }

            const p = param as { current: number, total: number }
            if (typeof p.current !== 'number' || typeof p.total !== 'number') {
                throw new Error('the "shard" option needs to have "current" and "total" properties with number values')
            }

            if (p.current < 0 || p.current > p.total) {
                throw new Error('the "shard.current" value has to be between 0 and "shard.total"')
            }
        }
    },

    /**
     * hooks
     */
    onPrepare: HOOK_DEFINITION,
    onWorkerStart: HOOK_DEFINITION,
    onWorkerEnd: HOOK_DEFINITION,
    before: HOOK_DEFINITION,
    beforeSession: HOOK_DEFINITION,
    beforeSuite: HOOK_DEFINITION,
    beforeHook: HOOK_DEFINITION,
    beforeTest: HOOK_DEFINITION,
    afterTest: HOOK_DEFINITION,
    afterHook: HOOK_DEFINITION,
    afterSuite: HOOK_DEFINITION,
    afterSession: HOOK_DEFINITION,
    after: HOOK_DEFINITION,
    onComplete: HOOK_DEFINITION,
    onReload: HOOK_DEFINITION,
    beforeAssertion: HOOK_DEFINITION,
    afterAssertion: HOOK_DEFINITION
}

export const WORKER_GROUPLOGS_MESSAGES = {
    normalExit: (cid: string) => `\n***** List of steps of WorkerID=[${cid}] *****`,
    exitWithError: (cid: string) => `\n***** List of steps of WorkerID=[${cid}] that preceded the error above *****`
}
