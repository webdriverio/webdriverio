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

/**
 * This class is responsible for managing shadow roots and their elements.
 * It allows to do deep element lookups and pierce into shadow DOMs across
 * all components of a page.
 */
export class ShadowRootManager {
    #browser: WebdriverIO.Browser
    #initialize: Promise<boolean>
    #shadowRoots = new Map<string, Set<string>>()
    #currentContext?: string
    /**
     * a map of Shadow DOM ids and their corresponding elements
     */
    #shadowRootElements = new Map<string, string>()

    constructor(browser: WebdriverIO.Browser) {
        this.#browser = browser

        /**
         * don't run setup when Bidi is not supported or running unit tests
         */
        if (!browser.isBidi || process.env.VITEST_WORKER_ID || browser.options?.automationProtocol !== 'webdriver') {
            this.#initialize = Promise.resolve(true)
            return
        }

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
            args[0].type !== 'string' || args[0].value !== '[WDIO]' ||
            args[1].type !== 'string' // command name, "newShadowRoot" or "removeShadowRoot"
        ) {
            return
        }

        /**
         * filter for log entry that was created in the right context
         */
        if (!log.source.context) {
            return
        }

        /**
         * create set for shadow roots if not existing
         */
        if (!this.#shadowRoots.has(log.source.context)) {
            this.#shadowRoots.set(log.source.context, new Set())
        }

        const shadowRootForContext = this.#shadowRoots.get(log.source.context)!
        const eventType = args[1].value
        if (eventType === 'newShadowRoot' && args[2].type === 'node' && args[3].type === 'node') {
            shadowRootForContext.add(args[2].sharedId as string)
            this.#shadowRootElements.set(args[2].sharedId as string, args[3].sharedId as string)
            return
        }

        if (eventType === 'removeShadowRoot' && args[2].type === 'node') {
            return args[2].sharedId && this.deleteShadowRoot(args[2].sharedId, log.source.context)
        }

        throw new Error(`Invalid parameters for "${eventType}" event: ${args.join(', ')}`)
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

    deleteShadowRoot (id: string, context?: string) {
        const c = context || this.#currentContext
        if (!c) {
            return
        }
        const shadowRoots = this.#shadowRoots.get(c)
        shadowRoots?.delete(id)
        this.#shadowRootElements.delete(id)
    }

    /**
     * Get the custom element based on the shadow root id
     * @param id element reference of a Shadow DOM element
     * @returns the element that caries the Shadow DOM
     */
    getElementWithShadowDOM (id: string) {
        return this.#shadowRootElements.get(id)
    }
}
