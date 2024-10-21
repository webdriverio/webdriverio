import logger from '@wdio/logger'

const polyfillManager = new Map<WebdriverIO.Browser, PolyfillManager>()
const log = logger('webdriverio:PolyfillManager')

export const NAME_POLYFILL = (
    'var __defProp = Object.defineProperty;' +
    'var __name = function (target, value) { return __defProp(target, \'name\', { value: value, configurable: true }); };' +
    'var __globalThis = (typeof globalThis === \'object\' && globalThis) || (typeof window === \'object\' && window);' +
    '__globalThis.__name = __name;'
)

export function getPolyfillManager(browser: WebdriverIO.Browser) {
    const existingPolyfillManager = polyfillManager.get(browser)
    if (existingPolyfillManager) {
        return existingPolyfillManager
    }

    const newContext = new PolyfillManager(browser)
    polyfillManager.set(browser, newContext)
    return newContext
}

/**
 * This class is responsible for setting polyfill scripts in the browser.
 */
export class PolyfillManager {
    #initialize: Promise<boolean>

    constructor(browser: WebdriverIO.Browser) {
        /**
         * don't run setup when Bidi is not supported or running unit tests
         */
        if (!browser.isBidi || process.env.WDIO_UNIT_TESTS || browser.options?.automationProtocol !== 'webdriver') {
            this.#initialize = Promise.resolve(true)
            return
        }

        /**
         * A polyfill to set `__name` to the global scope which is needed for WebdriverIO to properly
         * execute custom (preload) scripts. When using `tsx` Esbuild runs some optimizations which
         * assume that the file contains these global variables. This is a workaround until this issue
         * is fixed.
         *
         * @see https://github.com/evanw/esbuild/issues/2605
         */
        const polyfill = (polyfill: string) => {
            const closure = new Function(polyfill)
            return closure()
        }

        /**
         * apply polyfill script for upcoming as well as current execution context
         */
        this.#initialize = Promise.all([
            browser.addInitScript(polyfill, NAME_POLYFILL),
            browser.execute(polyfill, NAME_POLYFILL)
        ]).then(() => {
            log.info('polyfill script added')
            return true
        }, () => false)
    }

    async initialize () {
        return this.#initialize
    }
}
