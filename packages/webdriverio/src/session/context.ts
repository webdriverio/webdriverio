import type { local } from 'webdriver'
import logger from '@wdio/logger'

import { SessionManager } from './session.js'
import { getMobileContext, getNativeContext } from '../utils/mobile.js'
import { environment } from '../environment.js'

const log = logger('webdriverio:context')
const COMMANDS_REQUIRING_RESET = ['deleteSession', 'refresh', 'switchToParentFrame']

export function getContextManager(browser: WebdriverIO.Browser) {
    return SessionManager.getSessionManager(browser, ContextManager)
}

export type FlatContextTree = Omit<local.BrowsingContextInfo, 'children'> & { children: string[] }

interface WindowSwitches {
    pending: string[]
    context?: string
}

/**
 * The context that `switchToWindow` commands give: the target of the last one without a
 * result yet, or else the context the driver is in.
 */
function windowSwitchTarget ({ pending, context }: WindowSwitches) {
    return pending.length > 0 ? pending[pending.length - 1] : context
}

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
    #getContextSupport = true
    #currentWindowHandle?: string
    /**
     * the handles of the `switchToWindow` commands without a result yet, in the order they
     * were sent, and the context the driver is in while they run: the one before them, then
     * the handle of each switch that succeeds
     */
    #windowSwitches?: WindowSwitches
    #onCommandResultBidiAndClassicListener: (event: { command: string, result: unknown, body: unknown }) => void
    #onCommandListener: (event: { command: string, body: unknown }) => void
    #onCommandResultMobileListener: (event: { command: string, result: unknown }) => void
    #navigationStartedListener: (nav: local.BrowsingContextNavigationInfo) => void
    #destroyedListener: (destroyed: local.BrowsingContextInfo) => void

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

        this.#onCommandResultBidiAndClassicListener = this.#onCommandResultBidiAndClassic.bind(this)
        this.#onCommandListener = this.#onCommand.bind(this)
        this.#onCommandResultMobileListener = this.#onCommandResultMobile.bind(this)
        this.#navigationStartedListener = this.#navigationStarted.bind(this)
        this.#destroyedListener = this.#contextDestroyed.bind(this)

        /**
         * Listens for the 'closeWindow' browser command to handle context changes.
         * (classic + bidi)
         */
        this.#browser.on('result', this.#onCommandResultBidiAndClassicListener)

        // only listen to command events if we are in a bidi session or a mobile session
        // Adding the check for mobile in the `this.isEnabled()` method breaking the method and throws
        // `Test execution failed: TypeError: __privateGet(...).sessionSubscribe is not a function`
        if (!this.isEnabled() && !this.#browser.isMobile) {
            return
        }

        /**
         * Listens for the 'switchToWindow' browser command to handle context changes.
         * Updates the browsingContext with the context passed in 'switchToWindow'.
         */
        this.#browser.on('command', this.#onCommandListener)

        /**
         * Listens for the 'closeWindow' browser command to handle context changes.
         */
        if (this.#browser.isMobile) {
            this.#browser.on('result', this.#onCommandResultMobileListener)
        } else {
            /**
             * Listen to the 'browsingContext.navigationStarted' event to handle context changes
             * through navigation within e.g. frames.
             */
            this.#browser.sessionSubscribe({
                events: ['browsingContext.navigationStarted', 'browsingContext.contextDestroyed']
            })
            this.#browser.on('browsingContext.navigationStarted', this.#navigationStartedListener)
            this.#browser.on('browsingContext.contextDestroyed', this.#destroyedListener)
        }
    }

    removeListeners(): void {
        super.removeListeners()
        this.#browser.off('result', this.#onCommandResultBidiAndClassicListener)
        this.#browser.off('command', this.#onCommandListener)
        if (this.#browser.isMobile) {
            this.#browser.off('result', this.#onCommandResultMobileListener)
        } else {
            this.#browser.off('browsingContext.navigationStarted', this.#navigationStartedListener)
            this.#browser.off('browsingContext.contextDestroyed', this.#destroyedListener)
        }
    }

    async #navigationStarted(nav: local.BrowsingContextNavigationInfo) {
        /**
         * no need to do anything as we navigate within the same context
         */
        if (!this.#currentContext || nav.context === this.#currentContext) {
            return
        }

        /**
         * a navigation event may have changed the tree structure, so we need to get the
         * current tree and see if our context is still there, if not, we need to reset
         * the context to the first context in the tree.
         */
        const { contexts } = await this.#browser.browsingContextGetTree({})
        /**
         * check if the context is still in the tree, if not, switch to...
         */
        const hasContext = this.findContext(this.#currentContext, contexts, 'byContextId')
        /**
         * ...the context we are navigating to
         */
        const newContext = contexts.find((context) => context.context === nav.context)
        if (!hasContext && newContext) {
            this.setCurrentContext(newContext.context)
            await this.#browser.switchToWindow(this.#currentContext)
            return
        }
    }

    async #contextDestroyed(destroyed: local.BrowsingContextInfo) {
        /**
         * A `switchToWindow` that fails goes back to the context from before it. If that
         * context is gone (e.g. the page removed the frame), the next command resolves the
         * window the driver is in instead.
         */
        const switches = this.#windowSwitches
        if (switches?.context && this.findContext(switches.context, [destroyed], 'byContextId')) {
            switches.context = undefined
        }

        /**
         * no need to do anything if the destroyed context is not the current one
         */
        if (!this.#currentContext || destroyed.context !== this.#currentContext) {
            return
        }

        /**
         * the current context was destroyed, e.g. when the user closes a tab or
         * popup window, so reset the current context and switch to a remaining
         * window to avoid running subsequent commands against a context that no
         * longer exists.
         */
        this.#currentWindowHandle = undefined
        this.#currentContext = undefined

        let handle: string | undefined
        try {
            /**
             * if the destroyed context is a child frame, resolve the top-level
             * context it belongs to rather than switching to a potentially
             * unrelated top-level window
             */
            if (destroyed.parent) {
                handle = await this.#getTopLevelContext(destroyed.parent)
            }

            if (!handle) {
                const windowHandles = await this.#browser.getWindowHandles()
                handle = windowHandles.find((windowHandle) => windowHandle !== destroyed.context) ?? windowHandles[0]
            }

            if (!handle) {
                return
            }

            /**
             * a newer context transition may have happened while the recovery
             * was resolving, in which case the cached context is already set
             * and must not be overwritten
             */
            if (this.#currentContext) {
                return
            }

            await this.#browser.switchToWindow(handle)

            /**
             * a newer context transition may also happen while the recovery
             * switch is pending, so only cache the handle if no other
             * transition took over in the meantime
             */
            if (this.#currentContext && this.#currentContext !== handle) {
                return
            }
            this.setCurrentContext(handle)
        } catch (err) {
            /**
             * the recovery switch failed (e.g. the target handle is already
             * gone), so clear the cached context to force a re-initialization
             * on the next `getCurrentContext()` call, unless a newer transition
             * already took over
             */
            if (!this.#currentContext || this.#currentContext === handle) {
                this.#currentContext = undefined
                this.#currentWindowHandle = undefined
            }
            log.warn(`Failed to switch context after "${destroyed.context}" was destroyed: ${(err as Error).message}`)
        }
    }

    /**
     * Resolve the top-level context of a given context id, e.g. the top-level
     * browsing context a child frame belongs to.
     * @param contextId the context id to resolve the top-level context for
     * @returns the top-level context id, or undefined if it can't be found
     */
    async #getTopLevelContext(contextId: string) {
        const { contexts } = await this.#browser.browsingContextGetTree({})
        // Child entries in getTree omit parent, so find the root containing the context.
        return contexts.find((context) =>
            this.findContext(contextId, [context], 'byContextId')
        )?.context
    }

    #onCommandResultBidiAndClassic(event: { command: string, result: unknown, body: unknown }) {
        /**
         * the `closeWindow` command returns:
         *   > the result of running the remote end steps for the Get Window Handles command, with session, URL variables and parameters.
         */
        if (event.command === 'closeWindow') {
            // Clear cached window handle
            this.#currentWindowHandle = undefined

            const windowHandles = (event.result as { value?: string[] }).value || []
            if (windowHandles.length === 0) {
                throw new Error('All window handles were removed, causing WebdriverIO to close the session.')
            }
            this.#currentContext = windowHandles[0]
            return this.#browser.switchToWindow(this.#currentContext)
        }

        /**
         * Update current window handle when 'getWindowHandle' succeeds
         */
        if (event.command === 'getWindowHandle') {
            const windowHandle = (event.result as { value?: string }).value || undefined
            this.#currentWindowHandle = windowHandle
        }

        /**
         * the `closeWindow` command returns:
         *  > the body of the Close Window command request, including the window handle it's switching to.
         *  > the result of the Close Window command, either an error object on failure, or null data on success.
         */
        if (event.command === 'switchToWindow') {
            const err = (event.result as { error?: unknown }).error || undefined
            // Only update current window handle when 'switchToWindow' has no error
            if (!err) {
                const windowHandle = (event.body as { handle?: string }).handle || undefined
                this.#currentWindowHandle = windowHandle
            }

            const switches = this.#windowSwitches
            const handle = (event.body as { handle?: string } | undefined)?.handle
            const index = switches && typeof handle === 'string' ? switches.pending.indexOf(handle) : -1
            if (switches && index > -1) {
                // no newer transition changed the context while the switch ran
                const unchanged = this.#currentContext === windowSwitchTarget(switches)
                switches.pending.splice(index, 1)
                if (!err) {
                    switches.context = handle
                }
                /**
                 * The results can come in another order than the switches were sent, so the
                 * context is what the switches give after this result. A switch that fails
                 * (e.g. the handle is of a closed tab) leaves the driver in the window it was
                 * in, so BiDi commands go there again instead of to the handle that failed.
                 */
                if (unchanged) {
                    this.#currentContext = windowSwitchTarget(switches)
                }
                if (switches.pending.length === 0) {
                    this.#windowSwitches = undefined
                }
            }
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
                    /**
                     * Nothing in the tree has this context as a child, which means one of
                     * two very different things. If the context is still in the tree it is
                     * simply a top-level one and there is nowhere to step up to, so this
                     * stays a no-op. If it is gone from the tree the page destroyed it,
                     * and keeping it cached would send every following BiDi command to a
                     * frame that does not exist with no way for a user to clear it, so
                     * drop it and let the next command resolve the context again.
                     */
                    const stillInTree = this.findContext(this.#currentContext!, contexts, 'byContextId')
                    if (stillInTree) {
                        return
                    }

                    this.#currentContext = undefined
                    this.#currentWindowHandle = undefined
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
            const { handle } = event.body as { handle: string }
            const switches = this.#windowSwitches ??= { pending: [], context: this.#currentContext }
            /**
             * Switches can overlap, e.g. the switch to the first remaining window after
             * `closeWindow`, which is not awaited. While the context is still the one the
             * pending switches give, the driver is in `switches.context`, and the target of a
             * switch without a result is not known to be valid. Otherwise a newer transition
             * set the context.
             */
            if (this.#currentContext !== windowSwitchTarget(switches)) {
                switches.context = this.#currentContext
            }
            switches.pending.push(handle)
            this.setCurrentContext(handle)
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
        if (this.#browser.isMobile && event.command === 'switchAppiumContext') {
            this.#mobileContext = (event.body as { name: string }).name
        }
    }

    #onCommandResultMobile(event: { command: string, result: unknown }) {
        if (event.command === 'getAppiumContext') {
            this.setCurrentContext((event.result as { value: string }).value)
        }
        if (
            event.command === 'switchAppiumContext' &&
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
        if (environment.value.variables.WDIO_UNIT_TESTS) {
            return ''
        }

        /**
         * If we're in a mobile context, we need to get the current context if it's not already set.
         */
        if (
            this.#browser.isMobile &&
            !this.#isNativeContext &&
            !this.#mobileContext &&
            this.#getContextSupport
        ) {
            const context = await this.#browser.getContext().catch((err) => {
                log.warn(
                    `Error getting context: ${err}\n\n` +
                    `WebDriver capabilities: ${JSON.stringify(this.#browser.capabilities)}\n` +
                    `Requested WebDriver capabilities: ${JSON.stringify(this.#browser.requestedCapabilities)}`
                )

                /**
                 * Avoid continuing fetching the context if the environment does not support it
                 */
                if (err.message.includes('Request failed with status code 405')) {
                    this.#getContextSupport = false
                }

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

    /**
     * Sets the cached current window handle value.
     * @param handle current window handle to set
     */
    setCurrentWindowHandle (handle?: string) {
        this.#currentWindowHandle = handle
    }

    /**
     * Returns the cached window handle.
     *
     * @returns the current window handle, or undefined if the current window is closed.
     */
    getCurrentWindowHandle() {
        return this.#currentWindowHandle
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
