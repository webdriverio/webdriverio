const DEFAULT_TIMEOUT = 10000

/* istanbul ignore next */

export const DEFAULT_CONFIGS = {
    sync: true,
    specs: [],
    suites: {},
    exclude: [],
    outputDir: undefined,
    logLevel: 'info',
    logLevels: {},
    excludeDriverLogs: [],
    baseUrl: undefined,
    bail: 0,
    waitforInterval: 500,
    waitforTimeout: 5000,
    framework: 'mocha',
    reporters: [],
    maxInstances: 100,
    maxInstancesPerCapability: 100,
    filesToWatch: [],
    connectionRetryTimeout: 90000,
    connectionRetryCount: 3,
    debug: false,
    execArgv: [],
    runnerEnv: {},
    runner: 'local',

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
    afterFeature: [],
    afterScenario: [],
    afterStep: []
}

export const SUPPORTED_HOOKS = [
    'before', 'beforeSession', 'beforeSuite', 'beforeHook', 'beforeTest', 'beforeCommand',
    'afterCommand', 'afterTest', 'afterHook', 'afterSuite', 'afterSession', 'after',
    'beforeFeature', 'beforeScenario', 'beforeStep', 'afterFeature',
    'afterScenario', 'afterStep', 'onReload', 'onPrepare', 'onComplete'
]
