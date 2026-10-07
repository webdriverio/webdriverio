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
    /**
     * a user-set `unhandledPromptBehavior` capability decides what happens to
     * a dialog, e.g. `ignore` keeps it open for `browser.getAlertText()`
     */
    #hasUserPromptBehavior: boolean

    #prompts = new Map<string, string>()

    #handleUserPromptListener = this.#handleUserPrompt.bind(this)
    #handleUserPromptClosedListener = this.#handleUserPromptClosed.bind(this)

    constructor(browser: WebdriverIO.Browser) {
        super(browser, DialogManager.name)
        this.#browser = browser

        const requested = browser.requestedCapabilities
        const requestedCaps = requested && 'alwaysMatch' in requested
            ? [requested.alwaysMatch, ...(requested.firstMatch || [])]
            : [requested]
        this.#hasUserPromptBehavior = requestedCaps.some(
            (caps) => typeof caps?.unhandledPromptBehavior !== 'undefined')

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
            events: ['browsingContext.userPromptOpened', 'browsingContext.userPromptClosed']
        }).then(() => true, () => false)
        // @ts-ignore this is a private event
        this.#browser.on('_dialogListenerRegistered', () => this.#switchListenerFlag(false))
        // @ts-ignore this is a private event
        this.#browser.on('_dialogListenerRemoved', () => this.#switchListenerFlag(true))
        this.#browser.on('browsingContext.userPromptOpened', this.#handleUserPromptListener)
        this.#browser.on('browsingContext.userPromptClosed', this.#handleUserPromptClosedListener)
    }

    removeListeners(): void {
        super.removeListeners()
        this.#browser.off('browsingContext.userPromptOpened', this.#handleUserPromptListener)
        this.#browser.off('browsingContext.userPromptClosed', this.#handleUserPromptClosedListener)
        this.#browser.removeAllListeners('_dialogListenerRegistered')
        this.#browser.removeAllListeners('_dialogListenerRemoved')
    }

    async initialize() {
        return this.#initialize
    }

    promptMessage (context: string): string | undefined {
        return this.#prompts.get(context)
    }

    clearPrompt (context: string) {
        this.#prompts.delete(context)
    }

    /**
     * capture shadow root elements propagated through console.debug
     */
    async #handleUserPrompt(log: local.BrowsingContextUserPromptOpenedParameters) {
        this.#prompts.set(log.context, log.message)
        if (this.#autoHandleDialog && !this.#hasUserPromptBehavior) {
            this.#prompts.delete(log.context)
            try {
                return await this.#browser.browsingContextHandleUserPrompt({
                    accept: false,
                    context: log.context
                })
            } catch (err) {
                // ignore race conditions when the dialog/context is gone before auto-dismiss runs
                if (
                    err instanceof Error &&
                    (err.message.includes('no such alert') || err.message.includes('no such frame'))
                ) {
                    return
                }
                throw err
            }
        }

        const dialog = new Dialog(log, this.#browser)
        this.#browser.emit('dialog', dialog)
    }

    /**
     * a prompt can close without WebdriverIO, e.g. through an `accept` or
     * `dismiss` unhandledPromptBehavior, so drop its stored message
     */
    #handleUserPromptClosed(log: local.BrowsingContextUserPromptClosedParameters) {
        this.#prompts.delete(log.context)
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

    constructor(event: local.BrowsingContextUserPromptOpenedParameters, browser: WebdriverIO.Browser) {
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
        await this.#handle({ accept: true, userText })
    }

    async dismiss() {
        await this.#handle({ accept: false })
    }

    /**
     * Answer the dialog in the context that opened it, which is not always
     * the session's current context (a held tab, for example). A dialog whose
     * context closed, or that another handler answered first, is done.
     */
    async #handle (params: { accept: boolean, userText?: string }) {
        const browser = this.#browser
        try {
            await browser.browsingContextHandleUserPrompt({
                context: this.#context,
                ...params
            })
        } catch (err) {
            if (
                err instanceof Error &&
                (err.message.includes('no such alert') || err.message.includes('no such frame'))
            ) {
                return
            }
            throw err
        } finally {
            getDialogManager(browser).clearPrompt(this.#context)
        }
    }
}
