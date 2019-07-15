import logger from '@wdio/logger'
import { validateConfig } from '@wdio/config'

import webdriverMonad from './monad'
import { DEFAULTS } from './constants'
import { startSession, getPrototype, getEnvironmentVars } from './utils'

import WebDriverProtocol from '../protocol/webdriver.json'
import JsonWProtocol from '../protocol/jsonwp.json'
import MJsonWProtocol from '../protocol/mjsonwp.json'
import AppiumProtocol from '../protocol/appium.json'
import ChromiumProtocol from '../protocol/chromium.json'

export default class WebDriver {
    static async newSession (options = {}, modifier, userPrototype = {}, commandWrapper) {
        const params = validateConfig(DEFAULTS, options)

        if (!options.logLevels || !options.logLevels['webdriver']) {
            logger.setLevel('webdriver', params.logLevel)
        }

        const { sessionId, prototype } = await startSession(params, userPrototype)
        const monad = webdriverMonad(params, modifier, prototype)
        return monad(sessionId, commandWrapper)
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

    /**
     * Protocols
     */
    static get WebDriverProtocol () {
        return WebDriverProtocol
    }
    static get JsonWProtocol () {
        return JsonWProtocol
    }
    static get MJsonWProtocol () {
        return MJsonWProtocol
    }
    static get AppiumProtocol () {
        return AppiumProtocol
    }
    static get ChromiumProtocol () {
        return ChromiumProtocol
    }
}

/**
 * Helper methods consumed by webdriverio package
 */
export {
    webdriverMonad,
    getPrototype
}
