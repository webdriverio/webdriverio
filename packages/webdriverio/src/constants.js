const DEFAULT_TEST_TIMEOUT = 30000
const HOOK_DEFINITION = {
    type: (param) => Array.isArray(param),
    default: []
}

export const WDIO_DEFAULTS = {
    /**
     * run WebdriverIO commands synchronously using Fibers package
     */
    sync: {
        type: 'boolean',
        default: true
    },
    /**
     * define specs for test execution
     */
    specs: {
        type: (param) => Array.isArray(param)
    },
    /**
     * exclude specs from test execution
     */
    exclude: {
        type: (param) => Array.isArray(param),
        default: []
    },
    /**
     * key/value definition of suites (named by key) and a list of specs as value
     * to specify a specific set of tests to execute
     */
    suites: {
        type: 'object',
        default: {}
    },
    /**
     * Shorten navigateTo command calls by setting a base url
     */
    baseUrl: {
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
     * Default interval for all waitFor* commands
     */
    waitforInterval: {
        type: 'number',
        default: 500
    },
    /**
     * Default timeout for all waitFor* commands
     */
    waitforTimeout: {
        type: 'number',
        default: 3000
    },
    /**
     * supported test framework by wdio testrunner
     */
    framework: {
        type: 'string'
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
        type: (param) => {
            /**
             * option must be an array
             */
            if (!Array.isArray(param)) {
                return false
            }

            /**
             * array elements must be:
             */
            for (const option of param) {
                /**
                 * either a string
                 */
                if (typeof option === 'string') {
                    continue
                }

                /**
                 * or an object that contains at least a `name` key with the name
                 * of the reporter and arbitrary options
                 */
                if (typeof option === 'object' && typeof option.name === 'string') {
                    continue
                }

                return false
            }

            return true
        },
        default: []
    },
    maxInstances: {
        type: 'number',
        default: 100
    },
    maxInstancesPerCapability: {
        type: 'number',
        default: 100
    },

    /**
     * framework defaults
     */
    mochaOpts: {
        type: 'object',
        default: {
            timeout: DEFAULT_TEST_TIMEOUT
        }
    },
    jasmineNodeOpts: {
        type: 'object',
        default: {
            defaultTimeoutInterval: DEFAULT_TEST_TIMEOUT
        }
    },
    cucumberOpts: {
        type: 'object',
        default: {
            timeout: DEFAULT_TEST_TIMEOUT
        }
    },

    /**
     * hooks
     */
    onPrepare: HOOK_DEFINITION,
    before: HOOK_DEFINITION,
    beforeSession: HOOK_DEFINITION,
    beforeSuite: HOOK_DEFINITION,
    beforeHook: HOOK_DEFINITION,
    beforeTest: HOOK_DEFINITION,
    beforeCommand: HOOK_DEFINITION,
    afterCommand: HOOK_DEFINITION,
    afterTest: HOOK_DEFINITION,
    afterHook: HOOK_DEFINITION,
    afterSuite: HOOK_DEFINITION,
    afterSession: HOOK_DEFINITION,
    after: HOOK_DEFINITION,
    onComplete: HOOK_DEFINITION,
    onError: HOOK_DEFINITION,
    onReload: HOOK_DEFINITION,

    /**
     * cucumber specific hooks
     */
    beforeFeature: HOOK_DEFINITION,
    beforeScenario: HOOK_DEFINITION,
    beforeStep: HOOK_DEFINITION,
    afterFeature: HOOK_DEFINITION,
    afterScenario: HOOK_DEFINITION,
    afterStep: HOOK_DEFINITION
}
