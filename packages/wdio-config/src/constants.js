const DEFAULT_TIMEOUT = 10000

/* istanbul ignore next */

export const DEFAULT_CONFIGS = {
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
    execArgv: [],
    runnerEnv: {},
    runner: 'local',
    featureFlags: {
        specFiltering: undefined
    },

    /*
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

    /*
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

    /*
     * cucumber specific hooks
     */
    beforeFeature: [],
    beforeScenario: [],
    beforeStep: [],
    afterStep: [],
    afterScenario: [],
    afterFeature: [],
}

export const SUPPORTED_HOOKS = [
    'before', 'beforeSession', 'beforeSuite', 'beforeHook', 'beforeTest', 'beforeCommand',
    'afterCommand', 'afterTest', 'afterHook', 'afterSuite', 'afterSession', 'after',
    'beforeFeature', 'beforeScenario', 'beforeStep', 'afterStep', 'afterScenario', 'afterFeature',
    'onReload', 'onPrepare', 'onComplete'
]

/*
 * these services should not be started in worker process
 */
export const NON_WORKER_SERVICES = [
    'chromedriver', 'selenium-standalone', 'appium', 'reportportal', 'firefox-profile'
]
