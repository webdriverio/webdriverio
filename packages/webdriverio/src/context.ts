import { type local } from 'webdriver'
import logger from '@wdio/logger'

const contextManager = new Map<WebdriverIO.Browser, ContextManager>()
const log = logger('webdriverio:ContextManager')

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
    #initialize: Promise<boolean>
    #currentContext?: string

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
            events: ['browsingContext.navigationStarted']
        }).then(() => true, () => false)
        this.#browser.on('browsingContext.navigationStarted', this.#handleNavigationStarted.bind(this))
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

    async initialize () {
        return this.#initialize
    }

    /**
     * We use this handler to observe the current context which is used to navigate to a certain url.
     * This is most likely the context that the user is using. However if a frame was loaded on the page
     * then this handler is triggered with the context of the frame. To find out which context we are in
     * we use the `getWindowHandle` method to validate our assumption before setting the `#currentContext`
     * value.
     *
     * @param {local.BrowsingContextNavigationInfo} context  browsing context used to navigate
     */
    async #handleNavigationStarted (context: local.BrowsingContextNavigationInfo) {
        const windowHandle = await this.#browser.getWindowHandle()
        if (context.context === windowHandle && context.url !== 'UNKNOWN') {
            log.info(`Update current context: ${context.context}`)
            this.#currentContext = context.context
        }
    }
    setCurrentContext (context: string) {
        this.#currentContext = context
    }

    async getCurrentContext () {
        if (!this.#currentContext) {
            this.#currentContext = await this.#browser.getWindowHandle()
        }
        return this.#currentContext
    }
}
