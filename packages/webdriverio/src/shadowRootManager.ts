import type { local } from 'webdriver'
import customElementWrapper from './scripts/customElement.js'

const shadowRootManager = new Map<WebdriverIO.Browser, ShadowRootManager>()

export function getShadowRootManager(browser: WebdriverIO.Browser) {
    const existingShadowRootManager = shadowRootManager.get(browser)
    if (existingShadowRootManager) {
        return existingShadowRootManager
    }

    const newContext = new ShadowRootManager(browser)
    shadowRootManager.set(browser, newContext)
    return newContext
}

export class ShadowRootManager {
    #browser: WebdriverIO.Browser
    #initialize: Promise<boolean>
    #shadowRoots = new Map<string, Set<string>>()
    #currentContext?: string

    constructor(browser: WebdriverIO.Browser) {
        this.#browser = browser

        /**
         * listen on required bidi events
         */
        this.#initialize = this.#browser.sessionSubscribe({
            events: ['log.entryAdded', 'browsingContext.load']
        }).then(() => true, () => false)
        this.#browser.on('log.entryAdded', this.handleLogEntry.bind(this))
        this.#browser.on('browsingContext.load', this.handleBrowsingContextLoad.bind(this))

        browser.scriptAddPreloadScript({
            functionDeclaration: customElementWrapper.toString()
        })
    }

    initialize () {
        return this.#initialize
    }

    /**
     * reset list of shadow roots for a specific browsing context
     */
    handleBrowsingContextLoad(response: local.BrowsingContextNavigationInfo) {
        this.#currentContext = response.context
        this.#shadowRoots.set(response.context, new Set())
    }

    /**
     * capture shadow root elements propagated through console.debug
     */
    handleLogEntry(log: local.LogEntry) {
        const args = 'args' in log && log.level === 'debug'
            ? log.args
            : undefined

        /**
         * filter for right log entry type
         */
        if (
            !args ||
            args.length !== 3 ||
            args[0].type !== 'string' || args[0].value !== '[WDIO]' ||
            args[1].type !== 'string' || args[1].value !== 'newShadowRoot' ||
            args[2].type !== 'node'
        ) {
            return
        }

        /**
         * filter for log entry that was created in the right context
         */
        if (!log.source.context || !this.#shadowRoots.has(log.source.context)) {
            return
        }

        const shadowRootForContext = this.#shadowRoots.get(log.source.context)
        shadowRootForContext?.add(args[2].sharedId as string)
    }

    /**
     * get shadow roots for a specific context
     * @param context context to get shadow roots for (default: current browsing context)
     * @returns list of shadow root ids for given context
     */
    getShadowRootsForContext(context?: string) {
        const c = context || this.#currentContext
        if (!c) {
            return []
        }
        const shadowRoots = this.#shadowRoots.get(c)
        return shadowRoots ? [...shadowRoots] : []
    }
}
