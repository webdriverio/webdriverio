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

        /**
         * Listens for the 'switchToWindow' browser command to handle context changes.
         * Updates the browsingContext with the context passed in 'switchToWindow'.
         */
        this.#browser.on('command', (event) => {
            if (event.command === 'switchToWindow') {
                this.setCurrentContext(event.body.handle)
            }
        })
    }

    /**
     * set context at the start of the session
     */
    async initialize () {
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
