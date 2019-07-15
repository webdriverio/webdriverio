import logger from '@wdio/logger'
import { validateConfig } from '@wdio/config'

import webdriverMonad from './monad'
import { DEFAULTS } from './constants'
import { startWebDriverSession, environmentDetector, getPrototype, getEnvironmentVars } from './utils'

export default class WebDriver {
    static async newSession (options = {}, modifier, userPrototype = {}, customCommandWrapper) {
        const params = validateConfig(DEFAULTS, options)

        if (!options.logLevels || !options.logLevels['webdriver']) {
            logger.setLevel('webdriver', params.logLevel)
        }

        const { sessionId, commandWrapper } = await startWebDriverSession(params)
        const environment = environmentDetector(params)
        const environmentPrototype = getEnvironmentVars(environment)
        const protocolCommands = getPrototype(environment, commandWrapper)
        const prototype = merge(protocolCommands, environmentPrototype, userPrototype)

        const monad = webdriverMonad(params, modifier, prototype)
        return monad(sessionId, customCommandWrapper)
    }

    /**
     * allows user to attach to existing sessions
     */
    static attachToSession (options = {}, modifier, userPrototype = {}, commandWrapper) {
        if (typeof options.sessionId !== 'string') {
            throw new Error('sessionId is required to attach to existing session')
        }

        // logLevel can be undefined in watch mode when SIGINT is called
        if (options.logLevel !== undefined) {
            logger.setLevel('webdriver', options.logLevel)
        }

        options.capabilities = options.capabilities || {}
        options.isW3C = options.isW3C === false ? false : true

        const environmentPrototype = getEnvironmentVars(options)
        const protocolCommands = getPrototype(options)
        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype }
        const monad = webdriverMonad(options, modifier, prototype)
        return monad(options.sessionId, commandWrapper)
    }

    static get WebDriver () {
        return WebDriver
    }
    static get DEFAULTS () {
        return DEFAULTS
    }
}

/**
 * Helper methods consumed by webdriverio package
 */
export {
    webdriverMonad,
    getPrototype
}
