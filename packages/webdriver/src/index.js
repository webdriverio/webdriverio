import logger from '@wdio/logger'

import { webdriverMonad, sessionEnvironmentDetector } from '@wdio/utils'
import { validateConfig } from '@wdio/config'

import { DEFAULTS } from './constants'
import { startWebDriverSession, getPrototype, getEnvironmentVars, setupDirectConnect } from './utils'

export default class WebDriver {
    static async newSession (options = {}, modifier, userPrototype = {}, customCommandWrapper) {
        const params = validateConfig(DEFAULTS, options)

        if (!options.logLevels || !options.logLevels['webdriver']) {
            logger.setLevel('webdriver', params.logLevel)
        }

        /**
         * if the server responded with direct connect information, update the
         * params to speak directly to the appium host instead of a load
         * balancer (see https://github.com/appium/python-client#direct-connect-urls
         * for example). But only do this if the user has enabled this
         * behavior in the first place.
         */
        if (params.enableDirectConnect) {
            setupDirectConnect(params)
        }

        const sessionId = await startWebDriverSession(params)
        const environment = sessionEnvironmentDetector(params)
        const environmentPrototype = getEnvironmentVars(environment)
        const protocolCommands = getPrototype(environment)
        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype }

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

    static async reloadSession (instance) {
        const params = {
            ...instance.options,
            capabilities: instance.requestedCapabilities
        }
        const sessionId = await startWebDriverSession(params)
        instance.sessionId = sessionId
        return sessionId
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
export { getPrototype }
