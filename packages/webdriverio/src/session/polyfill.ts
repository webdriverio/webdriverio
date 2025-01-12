import logger from '@wdio/logger'
import type { local } from 'webdriver'

import { SessionManager } from './session.js'

export function getPolyfillManager(browser: WebdriverIO.Browser) {
    return SessionManager.getSessionManager(browser, PolyfillManager)
}

const log = logger('webdriverio:PolyfillManager')

/**
 * A polyfill to set `__name` to the global scope which is needed for WebdriverIO to properly
 * execute custom (preload) scripts. When using `tsx` Esbuild runs some optimizations which
 * assume that the file contains these global variables. This is a workaround until this issue
 * is fixed.
 *
 * @see https://github.com/evanw/esbuild/issues/2605
 */
export const NAME_POLYFILL = (
    'var __defProp = Object.defineProperty;' +
    'var __name = function (target, value) { return __defProp(target, \'name\', { value: value, configurable: true }); };' +
    'var __globalThis = (typeof globalThis === \'object\' && globalThis) || (typeof window === \'object\' && window);' +
    '__globalThis.__name = __name;'
)

/**
 * This class is responsible for setting polyfill scripts in the browser.
 */
export class PolyfillManager extends SessionManager {
    #initialize: Promise<boolean>
    #browser: WebdriverIO.Browser
    #scriptsRegisteredInContexts: Set<string> = new Set()

    constructor(browser: WebdriverIO.Browser) {
        super(browser, PolyfillManager.name)
        this.#browser = browser

        /**
         * don't run setup when Bidi is not supported or running unit tests
         */
        if (!this.isEnabled()) {
            this.#initialize = Promise.resolve(true)
            return
        }

        /**
         * apply polyfill script for upcoming as well as current execution context
         */
        this.#initialize = Promise.all([
            this.#browser.browsingContextGetTree({}).then(({ contexts }) => {
                return Promise.all(contexts.map((context) => this.#registerScripts(context)))
            }),
            this.#browser.sessionSubscribe({
                events: ['browsingContext.contextCreated']
            })
        ]).then(() => true, () => false)

        this.#browser.on('browsingContext.contextCreated', this.#registerScripts.bind(this))
    }

    removeListeners() {
        super.removeListeners()
        this.#browser.off('browsingContext.contextCreated', this.#registerScripts.bind(this))
    }

    #registerScripts (context: Pick<local.BrowsingContextInfo, 'context' | 'parent'>) {
        if (this.#scriptsRegisteredInContexts.has(context.context)) {
            return
        }

        const functionDeclaration = `(() => {${NAME_POLYFILL}})()`
        log.info(`Adding polyfill script to context with id ${context.context}`)
        this.#scriptsRegisteredInContexts.add(context.context)
        return Promise.all([
            !context.parent
                ? this.#browser.scriptAddPreloadScript({
                    functionDeclaration,
                    contexts: [context.context]
                })
                : Promise.resolve(),
            this.#browser.scriptCallFunction({
                functionDeclaration,
                target: context,
                awaitPromise: false
            }).catch(() => {
                /**
                 * this may fail if the context is already destroyed
                 */
            })
        ])
    }

    async initialize () {
        return this.#initialize
    }
}
