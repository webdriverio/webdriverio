import type { Hooks } from './types'

const DEFAULT_TIMEOUT = 10000

/* istanbul ignore next */

export const DEFAULT_CONFIGS = () => ({
    specs: [],
    suites: {},
    exclude: [],
    outputDir: undefined,
    logLevel: 'info' as const,
    logLevels: {},
    excludeDriverLogs: [],
    bail: 0,
    waitforInterval: 500,
    waitforTimeout: 5000,
    framework: 'mocha' as const,
    reporters: [],
    services: [],
    maxInstances: 100,
    maxInstancesPerCapability: 100,
    filesToWatch: [],
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    execArgv: [],
    runnerEnv: {},
    runner: 'local' as const,

    /**
     * framework defaults
     */
    mochaOpts: {
        timeout: DEFAULT_TIMEOUT
    },
    jasmineNodeOpts: {
        defaultTimeoutInterval: DEFAULT_TIMEOUT
    },
    cucumberOpts: {
        timeout: DEFAULT_TIMEOUT
    },

    /**
     * hooks
     */
    onPrepare: [],
    onWorkerStart: [],
    before: [],
    beforeSession: [],
    beforeSuite: [],
    beforeHook: [],
    beforeTest: [],
    beforeCommand: [],
    afterCommand: [],
    afterTest: [],
    afterHook: [],
    afterSuite: [],
    afterSession: [],
    after: [],
    onComplete: [],
    onReload: [],

    /**
     * cucumber specific hooks
     */
    beforeFeature: [],
    beforeScenario: [],
    beforeStep: [],
    afterStep: [],
    afterScenario: [],
    afterFeature: [],
})

export const SUPPORTED_HOOKS: (keyof Hooks)[] = [
    'before', 'beforeSession', 'beforeSuite', 'beforeHook', 'beforeTest', 'beforeCommand',
    'afterCommand', 'afterTest', 'afterHook', 'afterSuite', 'afterSession', 'after',
    'beforeFeature', 'beforeScenario', 'beforeStep', 'afterStep', 'afterScenario', 'afterFeature',
    'onReload', 'onPrepare', 'onWorkerStart', 'onComplete'
]

export const SUPPORTED_FILE_EXTENSIONS = [
    '.js', '.mjs', '.es6', '.ts', '.feature', '.coffee', '.cjs'
]
