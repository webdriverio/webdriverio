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

/**
 * unicode characters
 * https://w3c.github.io/webdriver/webdriver-spec.html#character-types
 */
export const UNICODE_CHARACTERS = {
    'NULL': '\uE000',
    'Unidentified': '\uE000',
    'Cancel': '\uE001',
    'Help': '\uE002',
    'Back space': '\uE003',
    'Backspace': '\uE003',
    'Tab': '\uE004',
    'Clear': '\uE005',
    'Return': '\uE006',
    'Enter': '\uE007',
    'Shift': '\uE008',
    'Control': '\uE009',
    'Alt': '\uE00A',
    'Pause': '\uE00B',
    'Escape': '\uE00C',
    'Space': '\uE00D',
    ' ': '\uE00D',
    'Pageup': '\uE00E',
    'PageUp': '\uE00E',
    'Page_Up': '\uE00E',
    'Pagedown': '\uE00F',
    'PageDown': '\uE00F',
    'Page_Down': '\uE00F',
    'End': '\uE010',
    'Home': '\uE011',
    'Left arrow': '\uE012',
    'Arrow_Left': '\uE012',
    'ArrowLeft': '\uE012',
    'Up arrow': '\uE013',
    'Arrow_Up': '\uE013',
    'ArrowUp': '\uE013',
    'Right arrow': '\uE014',
    'Arrow_Right': '\uE014',
    'ArrowRight': '\uE014',
    'Down arrow': '\uE015',
    'Arrow_Down': '\uE015',
    'ArrowDown': '\uE015',
    'Insert': '\uE016',
    'Delete': '\uE017',
    'Semicolon': '\uE018',
    'Equals': '\uE019',
    'Numpad 0': '\uE01A',
    'Numpad 1': '\uE01B',
    'Numpad 2': '\uE01C',
    'Numpad 3': '\uE01D',
    'Numpad 4': '\uE01E',
    'Numpad 5': '\uE01F',
    'Numpad 6': '\uE020',
    'Numpad 7': '\uE021',
    'Numpad 8': '\uE022',
    'Numpad 9': '\uE023',
    'Multiply': '\uE024',
    'Add': '\uE025',
    'Separator': '\uE026',
    'Subtract': '\uE027',
    'Decimal': '\uE028',
    'Divide': '\uE029',
    'F1': '\uE031',
    'F2': '\uE032',
    'F3': '\uE033',
    'F4': '\uE034',
    'F5': '\uE035',
    'F6': '\uE036',
    'F7': '\uE037',
    'F8': '\uE038',
    'F9': '\uE039',
    'F10': '\uE03A',
    'F11': '\uE03B',
    'F12': '\uE03C',
    'Command': '\uE03D',
    'Meta': '\uE03D',
    'Zenkaku_Hankaku': '\uE040',
    'ZenkakuHankaku': '\uE040'
}

export const W3C_SELECTOR_STRATEGIES = ['css selector', 'link text', 'partial link text', 'tag name', 'xpath']
