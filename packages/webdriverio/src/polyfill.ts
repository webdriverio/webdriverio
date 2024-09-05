import logger from '@wdio/logger'

const polyfillManager = new Map<WebdriverIO.Browser, PolyfillManager>()
const log = logger('webdriverio:PolyfillManager')

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
        if (!browser.isBidi || process.env.VITEST_WORKER_ID || browser.options?.automationProtocol !== 'webdriver') {
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
        const polyfill = () => {
            const closure = new Function(
                'var __defProp = Object.defineProperty;' +
                'var __name = (target, value) => __defProp(target, \'name\', { value, configurable: true });' +
                'globalThis.__name = __name;'
            )
            return closure()
        }

        /**
         * apply polyfill script for upcoming as well as current execution context
         */
        this.#initialize = Promise.all([
            browser.addInitScript(polyfill),
            browser.execute(polyfill)
        ]).then(() => {
            log.info('polyfill script added')
            return true
        }, () => false)
    }

    async initialize () {
        return this.#initialize
    }
}
