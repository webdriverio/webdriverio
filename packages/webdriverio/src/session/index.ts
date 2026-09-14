import { getPolyfillManager } from './polyfill.js'
import { getShadowRootManager } from './shadowRoot.js'
import { getNetworkManager } from './networkManager.js'
import { getDialogManager } from './dialog.js'
import { getContextManager } from './context.js'

/**
 * register all session relevant singletons on the instance
 */
export function registerSessionManager(instance: WebdriverIO.Browser) {
    // Register ContextManager for all sessions
    const initializationPromises: Promise<unknown>[] = [
        getContextManager(instance).initialize(),
    ]

    /**
     * only register session manager for sessions that appear to support
     * WebDriver Bidi
     */
    if (typeof instance.capabilities.webSocketUrl === 'string') {
        initializationPromises.push(
            getPolyfillManager(instance).initialize(),
            getShadowRootManager(instance).initialize(),
            getNetworkManager(instance).initialize(),
            getDialogManager(instance).initialize()
        )
    }

    return Promise.all(initializationPromises)
}
