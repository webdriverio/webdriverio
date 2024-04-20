import { type local } from 'webdriver'

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
    #shadowRoots = new Map<string, ShadowRootTree>()
    #browsingContexts = new Set<local.BrowsingContextInfo>()

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
            events: ['log.entryAdded', 'browsingContext.contextCreated', 'browsingContext.contextDestroyed']
        }).then(() => true, () => false)
        this.#browser.on('log.entryAdded', this.handleLogEntry.bind(this))
        this.#browser.on('browsingContext.contextCreated', this.handleBrowsingContextCreated.bind(this))
        this.#browser.on('browsingContext.contextDestroyed', this.handleBrowsingContextDestroyed.bind(this))

        browser.scriptAddPreloadScript({
            functionDeclaration: customElementWrapper.toString()
        })
    }

    get browsingContexts () {
        return Array.from(this.#browsingContexts).map((ctx) => ctx.context)
    }

    async initialize () {
        const tree = await this.#browser.browsingContextGetTree({})
        const activeContext = tree.contexts.shift()
        if (activeContext) {
            this.#browsingContexts.add(activeContext)
        }

        return this.#initialize
    }

    /**
     * reset list of shadow roots for a specific browsing context
     */
    handleBrowsingContextCreated(browsingContext: local.BrowsingContextInfo) {
        this.#browsingContexts.add(browsingContext)
    }

    handleBrowsingContextDestroyed(browsingContext: local.BrowsingContextInfo) {
        const context = Array.from(this.#browsingContexts).find((ctx) => ctx.context === browsingContext.context)
        if (context) {
            this.#browsingContexts.delete(context)
        }
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

        const eventType = args[1].value
        if (eventType === 'newShadowRoot' && args[2].type === 'node' && args[3].type === 'node') {
            const [/* [WDIO] */, /* newShadowRoot */, shadowElem, rootElem] = args
            if (!this.#shadowRoots.has(log.source.context)) {
                /**
                 * initiate shadow tree for context
                 */
                if (!rootElem.sharedId) {
                    throw new Error(`Expected "sharedId" parameter from object ${rootElem}`)
                }
                this.#shadowRoots.set(log.source.context, new ShadowRootTree(rootElem.sharedId))
            }

            const tree = this.#shadowRoots.get(log.source.context)
            if (!tree) {
                throw new Error(`Couldn't find tree for context id ${log.source.context}`)
            }
            if (
                // we expect an element id
                !shadowElem.sharedId ||
                // we expect the element to have a shadow root
                !shadowElem.value?.shadowRoot?.sharedId ||
                // we expect the shadow root to have a proper type
                shadowElem.value.shadowRoot.value?.nodeType !== 11
            ) {
                throw new Error(`Expected element with shadow root but found ${JSON.stringify(shadowElem, null, 4)}`)
            }

            tree.addShadowElement(shadowElem.sharedId, shadowElem.value.shadowRoot.sharedId)
            return
        }

        if (eventType === 'removeShadowRoot' && args[2].type === 'node' && args[2].sharedId) {
            const tree = this.#shadowRoots.get(log.source.context)
            if (!tree) {
                return
            }
            return tree.remove(args[2].sharedId)
        }

        throw new Error(`Invalid parameters for "${eventType}" event: ${args.join(', ')}`)
    }

    getShadowElementsByContextId (contextId: string, scope?: string): string[] {
        let tree = this.#shadowRoots.get(contextId)
        if (!tree) {
            return []
        }

        if (scope) {
            const subTree = tree.find(scope)
            if (!subTree) {
                throw new Error(`Couldn't find shadow element with id ${scope}`)
            }
            tree = subTree
        }

        return tree.getAllLookupScopes()
    }

    deleteShadowRoot (element: string, contextId: string) {
        const tree = this.#shadowRoots.get(contextId)
        if (!tree) {
            return
        }
        return tree.remove(element)
    }
}

export class ShadowRootTree {
    element: string
    shadowRoot?: string
    children = new Set<ShadowRootTree>()

    constructor (element: string, shadowRoot?: string) {
        this.element = element
        this.shadowRoot = shadowRoot
    }

    addShadowElement (element: string, shadowRoot: string): void
    addShadowElement (scope: string, element: string, shadowRoot: string): void
    addShadowElement (...args: (string | undefined)[]) {
        const [scope, element, shadowRoot] = args
        if (!scope || !element) {
            throw new Error('Method "addShadowElement" expects at least 2 arguments')
        }

        if (!shadowRoot) {
            this.children.add(new ShadowRootTree(scope, element))
            return
        }
        const tree = this.find(scope)
        if (!tree) {
            throw new Error(`Couldn't find element with id ${scope}`)
        }

        tree.addShadowElement(element, shadowRoot)
        return
    }

    find (element: string): ShadowRootTree | undefined {
        if (this.element === element) {
            return this
        }

        for (const child of this.children) {
            const elem = child.find(element)
            if (elem) {
                return elem
            }
        }

        return undefined
    }

    getAllLookupScopes (): string[] {
        return [
            this.shadowRoot ?? this.element,
            ...Array.from(this.children).map((tree) => tree.getAllLookupScopes())
        ].flat()
    }

    remove (element: string): boolean {
        for (const child of this.children) {
            if (child.element === element) {
                return this.children.delete(child)
            }

            const wasFound = child.remove(element)
            if (wasFound) {
                return true
            }
        }

        return false
    }
}
