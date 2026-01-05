import logger from '@wdio/logger'

import type { remote } from 'webdriver'

import { SessionManager } from './session.js'
import customElementWrapper, { type CustomElementEvent } from '../scripts/customElement.js'

const log = logger('webdriverio:ShadowRootManager')

export function getShadowRootManager(browser: WebdriverIO.Browser) {
    return SessionManager.getSessionManager(browser, ShadowRootManager)
}

/**
 * This class is responsible for managing shadow roots and their elements.
 * It allows to do deep element lookups and pierce into shadow DOMs across
 * all components of a page.
 */
export class ShadowRootManager extends SessionManager {
    #browser: WebdriverIO.Browser
    #initialize: Promise<boolean>
    #shadowRoots = new Map<string, ShadowRootTree>()
    #documentElement?: remote.ScriptNodeRemoteValue
    #frameDepth = 0

    constructor(browser: WebdriverIO.Browser) {
        super(browser, ShadowRootManager.name)
        this.#browser = browser

        /**
         * don't run setup when Bidi is not supported or running unit tests
         */
        if (!this.isEnabled()) {
            this.#initialize = Promise.resolve(true)
            return
        }

        /**
         * listen on required bidi events
         */
        this.#initialize = this.#browser.sessionSubscribe({
            events: ['log.entryAdded', 'browsingContext.navigationStarted']
        }).then(() => true, () => false)
        this.#browser.on('result', this.#commandResultHandler.bind(this))
        this.#browser.on('bidiCommand', this.#handleBidiCommand.bind(this))

        console.log('\n\n ADD MEE\n\n')

        this.#browser.addInitScript(customElementWrapper).then((script) => {
            script.on('data', this.registerShadowRoot.bind(this))
        })
    }

    removeListeners(): void {
        super.removeListeners()
        this.#browser.off('result', this.#commandResultHandler.bind(this))
        this.#browser.off('bidiCommand', this.#handleBidiCommand.bind(this))
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
    #commandResultHandler (result: { command: string, result: unknown }) {
        const noResultError = typeof result.result === 'object' && result.result && 'error' in result.result && !result.result.error
        if (result.command === 'switchToFrame' && noResultError) {
            this.#frameDepth++
        }
        if (result.command === 'switchToParentFrame' && noResultError) {
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
    registerShadowRoot(ev: CustomElementEvent) {
        const { type: eventType } = ev
        if (eventType === 'newShadowRoot') {
            const { window, shadowElement, rootElement, isDocument, documentElement } = ev
            if (!this.#shadowRoots.has(window.context)) {
                /**
                 * initiate shadow tree for context
                 */
                if (!rootElement.sharedId) {
                    throw new Error(`Expected "sharedId" parameter from object ${rootElement}`)
                }
                this.#shadowRoots.set(window.context, new ShadowRootTree(rootElement.sharedId))
            } else if (isDocument) {
                /**
                 * we've discovered a new root for the same context, this can happen if a page load
                 * occured after we registered the first shadow root
                 */
                if (!rootElement.sharedId) {
                    throw new Error(`Expected "sharedId" parameter from object ${rootElement}`)
                }

                /**
                 * only overwrite if `root.sharedId` is different, otherwise it's another shadow component
                 * within the same context/document
                 */
                const tree = this.#shadowRoots.get(window.context)
                if (tree?.element !== rootElement.sharedId) {
                    this.#shadowRoots.set(window.context, new ShadowRootTree(rootElement.sharedId))
                }
            }

            /**
             * store document element
             */
            this.#documentElement = documentElement

            const tree = this.#shadowRoots.get(window.context)
            if (!tree) {
                throw new Error(`Couldn't find tree for context id ${window.context}`)
            }
            if (
                // we expect an element id
                !shadowElement.sharedId ||
                // we expect the element to have a shadow root
                !shadowElement.value?.shadowRoot?.sharedId ||
                // we expect the shadow root to have a proper type
                shadowElement.value.shadowRoot.value?.nodeType !== 11
            ) {
                return log.warn(`Expected element with shadow root but found <${shadowElement.value?.localName} />`)
            }

            log.info(`Registered new shadow root for element <${shadowElement.value.localName} /> with id ${shadowElement.value.shadowRoot.sharedId}`)
            const newTree = new ShadowRootTree(
                shadowElement.sharedId,
                shadowElement.value.shadowRoot.sharedId,
                shadowElement.value.shadowRoot.value.mode
            )
            if (rootElement.sharedId) {
                console.log('ADD', rootElement.sharedId, newTree)
                tree.addShadowElement(rootElement.sharedId, newTree)
            } else {
                tree.addShadowElement(newTree)
            }
            return
        }

        if (eventType === 'removeShadowRoot') {
            const { window, element } = ev
            const tree = this.#shadowRoots.get(window.context)
            const sharedId = element.sharedId
            if (!tree || !sharedId) {
                return
            }
            return tree.remove(sharedId)
        }

        throw new Error(`Invalid parameters for "${eventType}" event: ${JSON.stringify(ev)}`)
    }

    getShadowElementsByContextId (contextId: string, scope?: string): string[] {
        let tree = this.#shadowRoots.get(contextId)
        if (!tree) {
            return []
        }

        let documentElement: string | undefined

        /**
         * if we have a scope, try to find sub tree, otherwise use root tree
         */
        if (scope) {
            const subTree = tree.find(scope)
            console.log('SUBTREE', scope, subTree, tree)
            if (subTree) {
                tree = subTree
            }
        } else {
            /**
             * ensure to include to document root if no scope is provided
             */
            documentElement = this.#documentElement?.sharedId
        }

        const elements = tree.getAllLookupScopes()

        /**
         * make sure to send back a unique list of elements
         */
        return [
            ...(documentElement ? [documentElement] : []),
            ...new Set(elements).values()
        ]
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
                return
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
