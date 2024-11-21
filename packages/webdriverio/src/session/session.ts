const sessionManager = new Map<string, Map<WebdriverIO.Browser, SessionManager>>()

export class SessionManager {
    /**
     * SessionManager constructor
     * Logic in here should be executed for all session singletons, e.g. remove instance
     * of itself when a session was deleted.
     * @param browser WebdriverIO.Browser
     * @param scope   scope of the session manager, e.g. context, network etc.
     */
    constructor(browser: WebdriverIO.Browser, scope: string) {
        browser.on('command', (ev) => {
            if (ev.command === 'deleteSession') {
                const sessionManagerInstances = sessionManager.get(scope)
                if (sessionManagerInstances) {
                    sessionManagerInstances.delete(browser)
                }
            }
        })
    }

    initialize(): unknown {
        return undefined as unknown
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
