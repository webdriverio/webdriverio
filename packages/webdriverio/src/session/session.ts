import { environment } from '../environment.js'

const sessionManager = new Map<string, Map<WebdriverIO.Browser, SessionManager>>()

const listenerRegisteredSession = new Set<string>()

export class SessionManager {
    #browser: WebdriverIO.Browser
    #scope: string

    /**
     * SessionManager constructor
     * Logic in here should be executed for all session singletons, e.g. remove instance
     * of itself when a session was deleted.
     * @param browser WebdriverIO.Browser
     * @param scope   scope of the session manager, e.g. context, network etc.
     */
    constructor(browser: WebdriverIO.Browser, scope: string) {
        this.#browser = browser
        this.#scope = scope
        const registrationId = `${this.#browser.sessionId}-${this.#scope}`
        if (!listenerRegisteredSession.has(registrationId)) {
            this.#browser.on('command', this.#onCommand.bind(this))
            listenerRegisteredSession.add(registrationId)
        }
    }

    #onCommand(ev: { command: string }) {
        if (ev.command === 'deleteSession') {
            const sessionManagerInstances = sessionManager.get(this.#scope)
            const sessionManagerInstance = sessionManagerInstances?.get(this.#browser)
            if (sessionManagerInstance && sessionManagerInstances) {
                sessionManagerInstance.removeListeners()
                sessionManagerInstances.delete(this.#browser)
            }
        }
    }

    removeListeners() {
        this.#browser.off('command', this.#onCommand.bind(this))
    }

    initialize(): unknown {
        return undefined as unknown
    }

    /**
     * check if session manager should be enabled, if
     */
    isEnabled() {
        return (
            // we are in a Bidi session
            this.#browser.isBidi &&
            // we are not running unit tests
            !environment.value.variables.WDIO_UNIT_TESTS
        )
    }

    static getSessionManager<T extends SessionManager>(browser: WebdriverIO.Browser, Manager: new (browser: WebdriverIO.Browser) => T): T {
        const scope = Manager.name
        let sessionManagerInstances = sessionManager.get(scope)
        if (!sessionManagerInstances) {
            sessionManagerInstances = new Map()
            sessionManager.set(scope, sessionManagerInstances)
        }

        let sessionManagerInstance = sessionManagerInstances.get(browser)
        if (!sessionManagerInstance) {
            sessionManagerInstance = new Manager(browser)
            sessionManagerInstances.set(browser, sessionManagerInstance)
        }

        return sessionManagerInstance as T
    }
}
