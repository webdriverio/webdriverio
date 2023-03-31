import type { Options, Services } from '@wdio/types'

const DEFAULT_TIMEOUT = 10000

/* istanbul ignore next */
export const DEFAULT_CONFIGS: () => Omit<Options.Testrunner, 'capabilities'> = () => ({
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
    injectGlobals: true,
    filesToWatch: [],
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    execArgv: [],
    runnerEnv: {},
    runner: 'local' as const,
    specFileRetries: 0,
    specFileRetriesDelay: 0,
    specFileRetriesDeferred: false,
    reporterSyncInterval: 100,
    reporterSyncTimeout: 5000,
    cucumberFeaturesWithLineNumbers: [],
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            transpileOnly: true
        },
        babelOpts: {}
    },

    /**
     * framework defaults
     */
    mochaOpts: {
        timeout: DEFAULT_TIMEOUT
    },
    jasmineOpts: {
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
    onWorkerEnd: [],
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
    afterFeature: []
})

export const SUPPORTED_HOOKS: (keyof Services.Hooks)[] = [
    'before', 'beforeSession', 'beforeSuite', 'beforeHook', 'beforeTest', 'beforeCommand',
    'afterCommand', 'afterTest', 'afterHook', 'afterSuite', 'afterSession', 'after',
    // @ts-ignore not defined in core hooks but added with cucumber
    'beforeFeature', 'beforeScenario', 'beforeStep', 'afterStep', 'afterScenario', 'afterFeature',
    'onReload', 'onPrepare', 'onWorkerStart', 'onWorkerEnd', 'onComplete'
]

export const SUPPORTED_FILE_EXTENSIONS = [
    '.js', '.jsx', '.mjs', '.es6', '.ts', '.tsx', '.feature', '.coffee', '.cjs'
]

export const NO_NAMED_CONFIG_EXPORT = (
    'No named export object called "config" found. Make sure you export the config object ' +
    'via `export.config = { ... }` when using CommonJS or `export const config = { ... }` when ' +
    'using ESM. Read more on this on https://webdriver.io/docs/configurationfile !'
)
