import logger from '@wdio/logger'
import { getMobileContext, getNativeContext } from './utils/mobile.js'

const contextManager = new Map<WebdriverIO.Browser, ContextManager>()
const log = logger('webdriverio:context')

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
    #mobileContext?: string
    #isNativeContext: boolean

    constructor(browser: WebdriverIO.Browser) {
        this.#browser = browser
        const capabilities = this.#browser.capabilities
        this.#isNativeContext = getNativeContext({ capabilities, isMobile: this.#browser.isMobile })
        this.#mobileContext = getMobileContext({
            capabilities,
            isAndroid: this.#browser.isAndroid,
            isNativeContext: this.#isNativeContext
        })

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

            /**
             * Keep track of the context to which we switch
             */
            if (this.#browser.isMobile && event.command === 'switchContext') {
                this.#mobileContext = event.body.name
            }
        })

        /**
         * Listens for the 'closeWindow' browser command to handle context changes.
         */
        this.#browser.on('result', (event) => {
            /**
             * the `closeWindow` command returns:
             *   > the result of running the remote end steps for the Get Window Handles command, with session, URL variables and parameters.
             */
            if (event.command === 'closeWindow') {
                this.#currentContext = (event.result as { value: string[] }).value[0]
                return this.#browser.switchToWindow(this.#currentContext)
            }

            if (this.#browser.isMobile) {
                if (event.command === 'getContext') {
                    this.setCurrentContext(event.result.value)
                }
                if (
                    event.command === 'switchContext' &&
                    event.result.value === null &&
                    this.#mobileContext
                ) {
                    this.setCurrentContext(this.#mobileContext)
                }
            }
        })
    }

    /**
     * Only run this session helper if BiDi is enabled and we're not in unit tests.
     */
    #isEnabled () {
        return !process.env.WDIO_UNIT_TESTS && (this.#browser.isBidi || this.#browser.isMobile)
    }

    /**
     * set context at the start of the session
     */
    async initialize () {
        if (!this.#isEnabled()) {
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
}
