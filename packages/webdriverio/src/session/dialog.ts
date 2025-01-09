import { type local } from 'webdriver'
import { SessionManager } from './session.js'

export function getDialogManager(browser: WebdriverIO.Browser) {
    return SessionManager.getSessionManager(browser, DialogManager)
}

/**
 * This class is responsible for managing shadow roots and their elements.
 * It allows to do deep element lookups and pierce into shadow DOMs across
 * all components of a page.
 */
export class DialogManager extends SessionManager {
    #browser: WebdriverIO.Browser
    #initialize: Promise<boolean>
    #autoHandleDialog = true

    constructor(browser: WebdriverIO.Browser) {
        super(browser, DialogManager.name)
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
            events: ['browsingContext.userPromptOpened']
        }).then(() => true, () => false)
        // @ts-ignore this is a private event
        this.#browser.on('_dialogListenerRegistered', () => this.#switchListenerFlag(false))
        // @ts-ignore this is a private event
        this.#browser.on('_dialogListenerRemoved', () => this.#switchListenerFlag(true))
        this.#browser.on('browsingContext.userPromptOpened', this.#handleUserPrompt.bind(this))
    }

    async initialize () {
        return this.#initialize
    }

    /**
     * capture shadow root elements propagated through console.debug
     */
    async #handleUserPrompt(log: local.BrowsingContextUserPromptOpenedParameters) {
        if (this.#autoHandleDialog) {
            return this.#browser.browsingContextHandleUserPrompt({
                accept: false,
                context: log.context
            })
        }

        const dialog = new Dialog(log, this.#browser)
        this.#browser.emit('dialog', dialog)
    }

    /**
     * Is called when a new dialog listener is registered with the `dialog` name.
     * In these cases we set a flag to the `#listener` map to indicate that we
     * are listening to dialog events for this page in this context.
     */
    #switchListenerFlag(value: boolean) {
        this.#autoHandleDialog = value
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
