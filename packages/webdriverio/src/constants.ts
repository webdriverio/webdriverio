import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { UNICODE_CHARACTERS } from '@wdio/utils'
import type { Options, Capabilities, Services, Reporters } from '@wdio/types'

enum SupportedAutomationProtocols {
    webdriver = 'webdriver',
    devtools = 'devtools',
    stub = './protocol-stub.js'
}

/* istanbul ignore next */
const HOOK_DEFINITION = {
    type: 'object' as const,
    validate: (param: any) => {
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
    }
}
export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

export const WDIO_DEFAULTS: Options.Definition<Options.WebdriverIO & Options.Testrunner> = {
    /**
     * allows to specify automation protocol
     */
    automationProtocol: {
        type: 'string',
        validate: (param: Options.SupportedProtocols) => {
            /**
             * path when proxy is used for browser testing
             */
            if (param.endsWith('driver.js')) {
                return
            }

            if (!Object.values(SupportedAutomationProtocols).includes(param.toLowerCase() as SupportedAutomationProtocols)) {
                throw new Error(`Currently only "webdriver" and "devtools" is supproted as automationProtocol, you set "${param}"`)
            }

            try {
                const __dirname = dirname(fileURLToPath(import.meta.url))
                const require = createRequire(import.meta.url)
                const id = param === SupportedAutomationProtocols.stub
                    ? resolve(__dirname, '..', 'build', param)
                    : param
                require.resolve(id)
            } catch (err: any) {
                /* istanbul ignore next */
                throw new Error(
                    'Automation protocol package is not installed!\n' +
                    `Please install it via \`npm install ${param}\``
                )
            }
        }
    },
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
     * capabilities of WebDriver sessions
     */
    capabilities: {
        type: 'object',
        validate: (param: Capabilities.RemoteCapabilities) => {
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
     * Project root directory path.
     */
    rootDir: {
        type: 'string'
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
     * list of strings to watch of `wdio` command is called with `--watch` flag
     */
    filesToWatch: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "filesToWatch" options needs to be a list of strings')
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
    beforeCommand: HOOK_DEFINITION,
    afterCommand: HOOK_DEFINITION,
    afterTest: HOOK_DEFINITION,
    afterHook: HOOK_DEFINITION,
    afterSuite: HOOK_DEFINITION,
    afterSession: HOOK_DEFINITION,
    after: HOOK_DEFINITION,
    onComplete: HOOK_DEFINITION,
    onReload: HOOK_DEFINITION
}

export const W3C_SELECTOR_STRATEGIES = ['css selector', 'link text', 'partial link text', 'tag name', 'xpath']

export const DRIVER_DEFAULT_ENDPOINT = {
    method: 'GET',
    host: 'localhost',
    port: 4444,
    path: '/status'
}

export const FF_REMOTE_DEBUG_ARG = '-remote-debugging-port'
export const DEEP_SELECTOR = '>>>'
export const ARIA_SELECTOR = 'aria/'

export const ERROR_REASON = [
    'Failed', 'Aborted', 'TimedOut', 'AccessDenied', 'ConnectionClosed',
    'ConnectionReset', 'ConnectionRefused', 'ConnectionAborted',
    'ConnectionFailed', 'NameNotResolved', 'InternetDisconnected',
    'AddressUnreachable', 'BlockedByClient', 'BlockedByResponse'
]

/**
 * Special Characters
 */
export const Key = {
    /**
     * Special control key that works cross browser for Mac, where it's the command key, and for
     * Windows or Linux, where it is the control key.
     */
    Ctrl: 'WDIO_CONTROL',
    NULL: UNICODE_CHARACTERS.NULL,
    Cancel: UNICODE_CHARACTERS.Cancel,
    Help: UNICODE_CHARACTERS.Help,
    Backspace: UNICODE_CHARACTERS.Backspace,
    Tab: UNICODE_CHARACTERS.Tab,
    Clear: UNICODE_CHARACTERS.Clear,
    Return: UNICODE_CHARACTERS.Return,
    Enter: UNICODE_CHARACTERS.Enter,
    Shift: UNICODE_CHARACTERS.Shift,
    Control: UNICODE_CHARACTERS.Control,
    Alt: UNICODE_CHARACTERS.Alt,
    Pause: UNICODE_CHARACTERS.Pause,
    Escape: UNICODE_CHARACTERS.Escape,
    Space: UNICODE_CHARACTERS.Space,
    PageUp: UNICODE_CHARACTERS.PageUp,
    PageDown: UNICODE_CHARACTERS.PageDown,
    End: UNICODE_CHARACTERS.End,
    Home: UNICODE_CHARACTERS.Home,
    ArrowLeft: UNICODE_CHARACTERS.ArrowLeft,
    ArrowUp: UNICODE_CHARACTERS.ArrowUp,
    ArrowRight: UNICODE_CHARACTERS.ArrowRight,
    ArrowDown: UNICODE_CHARACTERS.ArrowDown,
    Insert: UNICODE_CHARACTERS.Insert,
    Delete: UNICODE_CHARACTERS.Delete,
    Semicolon: UNICODE_CHARACTERS.Semicolon,
    Equals: UNICODE_CHARACTERS.Equals,
    Numpad0: UNICODE_CHARACTERS['Numpad 0'],
    Numpad1: UNICODE_CHARACTERS['Numpad 1'],
    Numpad2: UNICODE_CHARACTERS['Numpad 2'],
    Numpad3: UNICODE_CHARACTERS['Numpad 3'],
    Numpad4: UNICODE_CHARACTERS['Numpad 4'],
    Numpad5: UNICODE_CHARACTERS['Numpad 5'],
    Numpad6: UNICODE_CHARACTERS['Numpad 6'],
    Numpad7: UNICODE_CHARACTERS['Numpad 7'],
    Numpad8: UNICODE_CHARACTERS['Numpad 8'],
    Numpad9: UNICODE_CHARACTERS['Numpad 9'],
    Multiply: UNICODE_CHARACTERS.Multiply,
    Add: UNICODE_CHARACTERS.Add,
    Separator: UNICODE_CHARACTERS.Separator,
    Subtract: UNICODE_CHARACTERS.Subtract,
    Decimal: UNICODE_CHARACTERS.Decimal,
    Divide: UNICODE_CHARACTERS.Divide,
    F1: UNICODE_CHARACTERS.F1,
    F2: UNICODE_CHARACTERS.F2,
    F3: UNICODE_CHARACTERS.F3,
    F4: UNICODE_CHARACTERS.F4,
    F5: UNICODE_CHARACTERS.F5,
    F6: UNICODE_CHARACTERS.F6,
    F7: UNICODE_CHARACTERS.F7,
    F8: UNICODE_CHARACTERS.F8,
    F9: UNICODE_CHARACTERS.F9,
    F10: UNICODE_CHARACTERS.F10,
    F11: UNICODE_CHARACTERS.F11,
    F12: UNICODE_CHARACTERS.F12,
    Command: UNICODE_CHARACTERS.Command,
    ZenkakuHankaku: UNICODE_CHARACTERS.ZenkakuHankaku
} as const
