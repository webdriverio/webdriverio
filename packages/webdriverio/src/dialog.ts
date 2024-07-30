import { type local } from 'webdriver'

const dialogManager = new Map<WebdriverIO.Browser, DialogManager>()

export function getDialogManager(browser: WebdriverIO.Browser) {
    const existingDialogManager = dialogManager.get(browser)
    if (existingDialogManager) {
        return existingDialogManager
    }

    const newContext = new DialogManager(browser)
    dialogManager.set(browser, newContext)
    return newContext
}

/**
 * This class is responsible for managing shadow roots and their elements.
 * It allows to do deep element lookups and pierce into shadow DOMs across
 * all components of a page.
 */
export class DialogManager {
    #browser: WebdriverIO.Browser
    #initialize: Promise<boolean>

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
            events: ['browsingContext.userPromptOpened']
        }).then(() => true, () => false)
        this.#browser.on('browsingContext.userPromptOpened', this.#handleUserPrompt.bind(this))
    }

    async initialize () {
        return this.#initialize
    }

    /**
     * capture shadow root elements propagated through console.debug
     */
    #handleUserPrompt(log: local.BrowsingContextUserPromptOpenedParameters) {
        const dialog = new Dialog(log, this.#browser)
        this.#browser.emit('dialog', dialog)
    }
}

export class Dialog {
    #browser: WebdriverIO.Browser
    #context: string
    #message: string
    #defaultValue?: string
    #type: local.BrowsingContextUserPromptOpenedParameters['type']

    constructor (event: local.BrowsingContextUserPromptOpenedParameters, browser: WebdriverIO.Browser) {
        this.#message = event.message
        this.#defaultValue = event.defaultValue
        this.#type = event.type
        this.#context = event.context
        this.#browser = browser
    }

    message() {
        return this.#message
    }

    defaultValue() {
        return this.#defaultValue
    }

    type() {
        return this.#type
    }

    /**
     * Returns when the dialog has been accepted.
     *
     * @alias dialog.accept
     * @param {string=} promptText  A text to enter into prompt. Does not cause any effects if the dialog's type is not prompt.
     * @returns {Promise<void>}
     */
    async accept(userText?: string) {
        await this.#browser.browsingContextHandleUserPrompt({
            accept: true,
            context: this.#context,
            userText
        })
    }

    async dismiss() {
        await this.#browser.browsingContextHandleUserPrompt({
            accept: false,
            context: this.#context
        })
    }
}
