import logger from '@wdio/logger'
import type { local } from 'webdriver'

import { SessionManager } from './session.js'
import { createFunctionDeclarationFromString } from '../utils/index.js'

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
export const polyfillFn = function webdriverioPolyfill () {
    const __defProp = Object.defineProperty
    const __name = function (target: unknown, value: unknown) {
        return __defProp(target, 'name', { value: value, configurable: true })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const __globalThis = (typeof globalThis === 'object' && globalThis) || (typeof window === 'object' && window) as any
    __globalThis.__name = __name
}

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

        // start listening for browsingContext.contextCreated
        this.#browser.on('browsingContext.contextCreated', this.#registerScripts.bind(this))

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
    }

    removeListeners() {
        super.removeListeners()
        // stop listening for browsingContext.contextCreated
        this.#browser.off('browsingContext.contextCreated', this.#registerScripts.bind(this))
    }

    #registerScripts (context: Pick<local.BrowsingContextInfo, 'context' | 'parent'>) {
        if (this.#scriptsRegisteredInContexts.has(context.context)) {
            return
        }

        const functionDeclaration = createFunctionDeclarationFromString(polyfillFn)
        log.info(`Adding polyfill script to context with id ${context.context}`)
        this.#scriptsRegisteredInContexts.add(context.context)
        return Promise.all([
            !context.parent
                ? this.#browser.scriptAddPreloadScript({
                    functionDeclaration,
                    contexts: [context.context]
                }).catch(() => {
                    /**
                     * In case the context is already destroyed before this promise is finished
                     * For example:
                     *   - an unsuspecting window (context) is opened
                     *   - registerScripts is triggered
                     *   - that window closes before the bidi call starts
                     *   - bidi call sends the request and gets something like `call rejected because the connection has been closed` error back
                     */
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
