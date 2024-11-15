const contextManager = new Map<WebdriverIO.Browser, ContextManager>()

export function getContextManager(browser: WebdriverIO.Browser) {
    const existingContextManager = contextManager.get(browser)
    if (existingContextManager) {
        return existingContextManager
    }

    const newContext = new ContextManager(browser)
    contextManager.set(browser, newContext)
    return newContext
}

/**
 * This class is responsible for managing context in a WebDriver session. Many BiDi commands
 * require to be executed in a specific context. This class is responsible for keeping track
 * of the current context and providing the current context the user is in.
 */
export class ContextManager {
    #browser: WebdriverIO.Browser
    #currentContext?: string

    constructor(browser: WebdriverIO.Browser) {
        this.#browser = browser
        if (!this.#isEnabled()) {
            return
        }

        /**
         * Listens for the 'switchToWindow' browser command to handle context changes.
         * Updates the browsingContext with the context passed in 'switchToWindow'.
         */
        this.#browser.on('command', (event) => {
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
             */
            if (
                event.command === 'switchToParentFrame' ||
                event.command === 'refresh'
            ) {
                this.#currentContext = undefined
            }
        })
    }

    /**
     * Only run this session helper if BiDi is enabled and we're not in unit tests.
     */
    #isEnabled () {
        return !process.env.WDIO_UNIT_TESTS && this.#browser.isBidi
    }

    /**
     * set context at the start of the session
     */
    async initialize () {
        if (!this.#isEnabled()) {
            return ''
        }

        const windowHandle = await this.#browser.getWindowHandle()
        this.#currentContext = windowHandle
        return windowHandle
    }

    setCurrentContext (context: string) {
        this.#currentContext = context
    }

    async getCurrentContext () {
        if (!this.#currentContext) {
            return this.initialize()
        }
        return this.#currentContext
    }
}
