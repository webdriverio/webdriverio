import { type local } from 'webdriver'
import logger from '@wdio/logger'

import customElementWrapper from './scripts/customElement.js'
import type { remote } from 'webdriver'

const shadowRootManager = new Map<WebdriverIO.Browser, ShadowRootManager>()
const log = logger('webdriverio:ShadowRootManager')

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
    #frameDepth = 0

    constructor(browser: WebdriverIO.Browser) {
        this.#browser = browser

        /**
         * don't run setup when Bidi is not supported or running unit tests
         */
        if (!browser.isBidi || process.env.WDIO_UNIT_TESTS || browser.options?.automationProtocol !== 'webdriver') {
            this.#initialize = Promise.resolve(true)
            return
        }

        /**
         * listen on required bidi events
         */
        this.#initialize = this.#browser.sessionSubscribe({
            events: ['log.entryAdded', 'browsingContext.navigationStarted']
        }).then(() => true, () => false)
        this.#browser.on('log.entryAdded', this.handleLogEntry.bind(this))
        this.#browser.on('result', this.#commandResultHandler.bind(this))
        this.#browser.on('bidiCommand', this.#handleBidiCommand.bind(this))
        browser.scriptAddPreloadScript({
            functionDeclaration: customElementWrapper.toString()
        })
    }

    async initialize () {
        return this.#initialize
    }

    /**
     * keep track of navigation events and remove shadow roots when they are no longer needed
     */
    #handleBidiCommand (command: Omit<remote.CommandData, 'id'>) {
        if (command.method !== 'browsingContext.navigate') {
            return
        }
        const params = command.params as remote.BrowsingContextNavigateParameters
        this.#shadowRoots.delete(params.context)
    }

    /**
     * keep track of frame depth
     */
    #commandResultHandler (result: { command: string, result: any }) {
        if (result.command === 'switchToFrame' && !result.result.error) {
            this.#frameDepth++
        }
        if (result.command === 'switchToParentFrame' && !result.result.error) {
            this.#frameDepth = Math.max(0, this.#frameDepth - 1)
        }
    }

    /**
     * check if we are within a frame
     * @returns {boolean} true if we are within a frame
     */
    isWithinFrame () {
        return this.#frameDepth > 0
    }

    /**
     * capture shadow root elements propagated through console.debug
     */
    handleLogEntry(logEntry: local.LogEntry) {
        const args = 'args' in logEntry && logEntry.level === 'debug'
            ? logEntry.args
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
        if (!logEntry.source.context) {
            return
        }

        const eventType = args[1].value
        if (eventType === 'newShadowRoot' && args[2].type === 'node' && args[3].type === 'node') {
            const [/* [WDIO] */, /* newShadowRoot */, shadowElem, rootElem, isDocument] = args
            if (!this.#shadowRoots.has(logEntry.source.context)) {
                /**
                 * initiate shadow tree for context
                 */
                if (!rootElem.sharedId) {
                    throw new Error(`Expected "sharedId" parameter from object ${rootElem}`)
                }
                this.#shadowRoots.set(logEntry.source.context, new ShadowRootTree(rootElem.sharedId))
            } else if (isDocument.type === 'boolean' && isDocument.value) {
                /**
                 * we've discovered a new root for the same context, this can happen if a page load
                 * occured after we registered the first shadow root
                 */
                if (!rootElem.sharedId) {
                    throw new Error(`Expected "sharedId" parameter from object ${rootElem}`)
                }

                /**
                 * only overwrite if `root.sharedId` is different, otherwise it's another shadow component
                 * within the same context/document
                 */
                const tree = this.#shadowRoots.get(logEntry.source.context)
                if (tree?.element !== rootElem.sharedId) {
                    this.#shadowRoots.set(logEntry.source.context, new ShadowRootTree(rootElem.sharedId))
                }
            }

            const tree = this.#shadowRoots.get(logEntry.source.context)
            if (!tree) {
                throw new Error(`Couldn't find tree for context id ${logEntry.source.context}`)
            }
            if (
                // we expect an element id
                !shadowElem.sharedId ||
                // we expect the element to have a shadow root
                !shadowElem.value?.shadowRoot?.sharedId ||
                // we expect the shadow root to have a proper type
                shadowElem.value.shadowRoot.value?.nodeType !== 11
            ) {
                return log.warn(`Expected element with shadow root but found <${shadowElem.value?.localName} />`)
            }

            log.info(`Registered new shadow root for element <${shadowElem.value.localName} /> with id ${shadowElem.value.shadowRoot.sharedId}`)
            const newTree = new ShadowRootTree(
                shadowElem.sharedId,
                shadowElem.value.shadowRoot.sharedId,
                shadowElem.value.shadowRoot.value.mode
            )
            rootElem.sharedId
                ? tree.addShadowElement(rootElem.sharedId, newTree)
                : tree.addShadowElement(newTree)
            return
        }

        if (eventType === 'removeShadowRoot' && args[2].type === 'node' && args[2].sharedId) {
            const tree = this.#shadowRoots.get(logEntry.source.context)
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

        /**
         * if we have a scope, try to find sub tree, otherwise use root tree
         */
        if (scope) {
            const subTree = tree.find(scope)
            if (subTree) {
                tree = subTree
            }
        }

        const elements = tree.getAllLookupScopes()

        /**
         * make sure to send back a unique list of elements
         */
        return [...new Set(elements).values()]
    }

    getShadowElementPairsByContextId (contextId: string, scope?: string): [string, string | undefined][] {
        let tree = this.#shadowRoots.get(contextId)
        if (!tree) {
            return []
        }

        if (scope) {
            const subTree = tree.find(scope)
            if (subTree) {
                tree = subTree
            }
        }

        return tree.flat().map((tree) => [tree.element, tree.shadowRoot])
    }

    getShadowRootModeById (contextId: string, element: string): ShadowRootMode | undefined {
        const tree = this.#shadowRoots.get(contextId)
        if (!tree) {
            return
        }

        const shadowTree = tree.find(element)
        if (!shadowTree) {
            return
        }

        return shadowTree.mode
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
    mode?: ShadowRootMode
    children = new Set<ShadowRootTree>()

    constructor (element: string, shadowRoot?: string, mode?: ShadowRootMode) {
        this.element = element
        this.shadowRoot = shadowRoot
        this.mode = mode
    }

    /**
     * Attach new shadow element to tree
     */
    addShadowElement (tree: ShadowRootTree): void
    /**
     * Attach new shadow element to tree of sub tree
     * @param scope {string} shadow element id of tree to attach new element to
     * @param element {string} element id
     * @param shadowRoot {string} shadow root id
     */
    addShadowElement (scope: string, tree: ShadowRootTree): void
    addShadowElement (...args: (ShadowRootTree | string | undefined)[]) {
        const [scope, treeArg] = args
        if (!scope && !treeArg) {
            throw new Error('Method "addShadowElement" expects at least 2 arguments')
        }

        if (scope instanceof ShadowRootTree) {
            this.children.add(scope)
            return
        }

        /**
         * if we have a scope, check if it matches any ShadowRootTree based
         * by element or shadow root id
         */
        if (typeof scope === 'string' && treeArg instanceof ShadowRootTree) {
            const tree = this.find(scope) || this.findByShadowId(scope)
            if (!tree) {
                throw new Error(`Couldn't find element with id ${scope}`)
            }

            tree.addShadowElement(treeArg)
            return
        }

        throw new Error('Invalid arguments for "addShadowElement" method')
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

    findByShadowId (shadowRoot: string): ShadowRootTree | undefined {
        if (this.shadowRoot === shadowRoot) {
            return this
        }

        for (const child of this.children) {
            const elem = child.findByShadowId(shadowRoot)
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

    flat (): ShadowRootTree[] {
        return [this, ...Array.from(this.children).map((tree) => tree.flat())].flat()
    }

    remove (element: string): boolean {
        const childArray = Array.from(this.children)
        for (let i = childArray.length - 1; i >= 0; i--) {
            if (childArray[i].element === element) {
                return this.children.delete(childArray[i])
            }

            const wasFound = childArray[i].remove(element)
            if (wasFound) {
                return true
            }
        }

        return false
    }
}
