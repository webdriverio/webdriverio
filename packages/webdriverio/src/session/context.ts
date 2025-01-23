import type { local } from 'webdriver'
import logger from '@wdio/logger'

import { SessionManager } from './session.js'
import { getMobileContext, getNativeContext } from '../utils/mobile.js'

const log = logger('webdriverio:context')
const COMMANDS_REQUIRING_RESET = ['deleteSession', 'refresh', 'switchToParentFrame']

export function getContextManager(browser: WebdriverIO.Browser) {
    return SessionManager.getSessionManager(browser, ContextManager)
}

export type FlatContextTree = Omit<local.BrowsingContextInfo, 'children'> & { children: string[] }

/**
 * This class is responsible for managing context in a WebDriver session. Many BiDi commands
 * require to be executed in a specific context. This class is responsible for keeping track
 * of the current context and providing the current context the user is in.
 */
export class ContextManager extends SessionManager {
    #browser: WebdriverIO.Browser
    #currentContext?: string
    #mobileContext?: string
    #isNativeContext: boolean

    constructor(browser: WebdriverIO.Browser) {
        super(browser, ContextManager.name)
        this.#browser = browser
        const capabilities = this.#browser.capabilities
        this.#isNativeContext = getNativeContext({ capabilities, isMobile: this.#browser.isMobile })
        this.#mobileContext = getMobileContext({
            capabilities,
            isAndroid: this.#browser.isAndroid,
            isNativeContext: this.#isNativeContext
        })

        /**
         * Listens for the 'closeWindow' browser command to handle context changes.
         * (classic + bidi)
         */
        this.#browser.on('result', this.#onCommandResultBidiAndClassic.bind(this))

        if (!this.isEnabled()) {
            return
        }

        /**
         * Listens for the 'switchToWindow' browser command to handle context changes.
         * Updates the browsingContext with the context passed in 'switchToWindow'.
         */
        this.#browser.on('command', this.#onCommand.bind(this))

        /**
         * Listens for the 'closeWindow' browser command to handle context changes.
         */
        if (this.#browser.isMobile) {
            this.#browser.on('result', this.#onCommandResultMobile.bind(this))
        }
    }

    removeListeners(): void {
        super.removeListeners()
        this.#browser.off('result', this.#onCommandResultBidiAndClassic.bind(this))
        this.#browser.off('command', this.#onCommand.bind(this))
        if (this.#browser.isMobile) {
            this.#browser.off('result', this.#onCommandResultMobile.bind(this))
        }
    }

    #onCommandResultBidiAndClassic(event: { command: string, result: unknown }) {
        /**
         * the `closeWindow` command returns:
         *   > the result of running the remote end steps for the Get Window Handles command, with session, URL variables and parameters.
         */
        if (event.command === 'closeWindow') {
            const windowHandles = (event.result as { value: string[] }).value
            if (windowHandles.length === 0) {
                throw new Error('All window handles were removed, causing WebdriverIO to close the session.')
            }
            this.#currentContext = windowHandles[0]
            return this.#browser.switchToWindow(this.#currentContext)
        }
    }

    #onCommand(event: { command: string, body: unknown }) {
        /**
         * update frame context if user switches using 'switchToParentFrame'
         */
        if (event.command === 'switchToParentFrame') {
            if (!this.#currentContext) {
                return
            }

            return this.#browser.browsingContextGetTree({}).then(({ contexts }) => {
                const parentContext = this.findParentContext(this.#currentContext!, contexts)
                if (!parentContext) {
                    return
                }
                this.setCurrentContext(parentContext.context)
            })
        }

        /**
         * update frame context if user switches using 'switchToWindow'
         * which is WebDriver Classic only
         */
        if (event.command === 'switchToWindow') {
            this.setCurrentContext((event.body as { handle: string }).handle)
        }

        /**
         * reset current context if:
         *   - user uses 'switchToParentFrame' which only impacts WebDriver Classic commands
         *   - user uses 'refresh' which resets the context in Classic and so should in Bidi
         *   - user uses 'reload' to reload the session
         */
        if (COMMANDS_REQUIRING_RESET.includes(event.command)) {
            this.#currentContext = undefined
        }

        /**
         * Keep track of the context to which we switch
         */
        if (this.#browser.isMobile && event.command === 'switchContext') {
            this.#mobileContext = (event.body as { name: string }).name
        }
    }

    #onCommandResultMobile(event: { command: string, result: unknown }) {
        if (event.command === 'getContext') {
            this.setCurrentContext((event.result as { value: string }).value)
        }
        if (
            event.command === 'switchContext' &&
            (event.result as { value: string | null }).value === null &&
            this.#mobileContext
        ) {
            this.setCurrentContext(this.#mobileContext)
        }
    }

    /**
     * set context at the start of the session
     */
    async initialize () {
        /**
         * don't run this in unit tests
         */
        if (process.env.WDIO_UNIT_TESTS) {
            return ''
        }

        /**
         * If we're in a mobile context, we need to get the current context if it's not already set.
         */
        if (
            this.#browser.isMobile &&
            !this.#isNativeContext &&
            !this.#mobileContext
        ) {
            const context = await this.#browser.getContext().catch((err) => {
                log.warn(
                    `Error getting context: ${err}\n\n` +
                    `WebDriver capabilities: ${JSON.stringify(this.#browser.capabilities)}\n` +
                    `Requested WebDriver capabilities: ${JSON.stringify(this.#browser.requestedCapabilities)}`
                )
                return undefined
            })
            this.#mobileContext = typeof context === 'string'
                ? context
                : typeof context === 'object'
                    ? context.id
                    : undefined
        }

        const windowHandle = this.#mobileContext || await this.#browser.getWindowHandle()
        this.setCurrentContext(windowHandle)
        return windowHandle
    }

    setCurrentContext (context: string) {
        this.#currentContext = context
        if (this.#browser.isMobile) {
            this.#isNativeContext = context ? context === 'NATIVE_APP' : this.#isNativeContext
            this.#mobileContext = context || undefined
        }
    }

    async getCurrentContext () {
        if (!this.#currentContext) {
            return this.initialize()
        }
        return this.#currentContext
    }

    get isNativeContext() {
        return this.#isNativeContext
    }

    get mobileContext() {
        return this.#mobileContext
    }

    /**
     * Get the flat context tree for the current session
     * @returns a flat list of all contexts in the current session
     */
    async getFlatContextTree (): Promise<Record<string, FlatContextTree>> {
        const tree = await this.#browser.browsingContextGetTree({})

        const mapContext = (context: local.BrowsingContextInfo): string[] => [
            context.context,
            ...(context.children || []).map(mapContext).flat(Infinity) as string[]
        ]

        /**
         * transform context tree into a flat list of context objects with references
         * to children
         */
        const allContexts: Record<string, FlatContextTree> = tree.contexts.map(mapContext).flat(Infinity)
            .reduce((acc, ctx: string) => {
                const context = this.findContext(ctx, tree.contexts, 'byContextId')
                acc[ctx] = context as unknown as FlatContextTree
                return acc
            }, {} as Record<string, FlatContextTree>)
        return allContexts
    }

    /**
     * Find the parent context of a given context id
     * @param contextId the context id you want to find the parent of
     * @param contexts  the list of contexts to search through returned from `browsingContextGetTree`
     * @returns         the parent context of the context with the given id
     */
    findParentContext (contextId: string, contexts: local.BrowsingContextInfoList): local.BrowsingContextInfo | undefined {
        for (const context of contexts) {
            if (context.children?.some((child) => child.context === contextId)) {
                return context
            }

            if (Array.isArray(context.children) && context.children.length > 0) {
                const result = this.findParentContext(contextId, context.children)
                if (result) {
                    return result
                }
            }
        }

        return undefined
    }

    /**
     * Find a context by URL or ID
     * @param urlOrId     The URL or ID of the context to find
     * @param contexts    The list of contexts to search through returned from `browsingContextGetTree`
     * @param matcherType The type of matcher to use to find the context
     * @returns           The context with the given URL or ID
     */
    findContext (
        urlOrId: string,
        contexts: local.BrowsingContextInfoList | null,
        matcherType: 'byUrl' | 'byUrlContaining' | 'byContextId'
    ): local.BrowsingContextInfo | undefined {
        const matcher = {
            byUrl,
            byUrlContaining,
            byContextId
        }[matcherType]
        for (const context of contexts || []) {
            if (matcher(context, urlOrId)) {
                return context
            }

            if (Array.isArray(context.children) && context.children.length > 0) {
                const result = this.findContext(urlOrId, context.children, matcherType)
                if (result) {
                    return result
                }
            }
        }

        return undefined
    }
}

function byUrl (context: local.BrowsingContextInfo, url: string) {
    return context.url === url
}

function byUrlContaining (context: local.BrowsingContextInfo, url: string) {
    return context.url.includes(url)
}

function byContextId (context: local.BrowsingContextInfo, contextId: string) {
    return context.context === contextId
}
