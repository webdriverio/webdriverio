/* istanbul ignore next */
const NOOP = () => {}

const DEFAULT_TEST_TIMEOUT = 30000
const HOOK_DEFINITION = {
    type: (param) => {
        /**
         * option must be an array
         */
        if (!Array.isArray(param)) {
            throw new Error('a hook option needs to be a list of functions')
        }

        /**
         * array elements must be functions
         */
        for (const option of param) {
            /**
             * either a string
             */
            if (typeof option === 'function') {
                continue
            }

            throw new Error('expected hook to be type of function')
        }

        return true
    },
    default: []
}
export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

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
        type: (param) => {
            if (!Array.isArray(param)) {
                throw new Error('the "specs" options needs to be a list of strings')
            }
        }
    },
    /**
     * exclude specs from test execution
     */
    exclude: {
        type: (param) => {
            if (!Array.isArray(param)) {
                throw new Error('the "exclude" options needs to be a list of strings')
            }
        },
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
                throw new Error('the "reporters" options needs to be a list of strings')
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
                 * or an array with the name of the reporter as first element and the options
                 * as second element
                 */
                if (
                    Array.isArray(option) &&
                    typeof option[1] === 'object' &&
                    (
                        (typeof option[0] === 'string') ||
                        (typeof option[0] === 'object' && typeof option[0].name === 'string')
                    )
                ) {
                    continue
                }

                throw new Error(
                    'a reporter should be either a string in the format "wdio-<reportername>-reporter" ' +
                    'or a function/class. Please see the docs for more information on custom reporters ' +
                    '(http://webdriver.io/guide/testrunner/reporters.html)'
                )
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
    logDir: {
        type: 'string',
        default: process.cwd()
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
    onPrepare: {
        type: 'function',
        default: NOOP
    },
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
    onComplete: {
        type: 'function',
        default: NOOP
    },
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
