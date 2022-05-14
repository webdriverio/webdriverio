import path from 'node:path'
import logger from '@wdio/logger'

import { webdriverMonad, sessionEnvironmentDetector } from '@wdio/utils'
import { validateConfig } from '@wdio/config'
import type { Options, Capabilities } from '@wdio/types'

import command from './command.js'
import { DEFAULTS } from './constants.js'
import {
    startWebDriverSession, getPrototype, getEnvironmentVars, setupDirectConnect
} from './utils.js'
import type { Client, AttachOptions, SessionFlags } from './types'

const log = logger('webdriver')

export default class WebDriver {
    static async newSession (
        options: Options.WebDriver,
        modifier?: (...args: any[]) => any,
        userPrototype = {},
        customCommandWrapper?: (...args: any[]) => any
    ): Promise<Client> {
        const params = validateConfig(DEFAULTS, options)

        if (!options.logLevels || !options.logLevels.webdriver) {
            logger.setLevel('webdriver', params.logLevel!)
        }

        /**
         * Store all log events in a file
         */
        if (params.outputDir && !process.env.WDIO_LOG_PATH) {
            process.env.WDIO_LOG_PATH = path.join(params.outputDir, 'wdio.log')
        }

        log.info('Initiate new session using the WebDriver protocol')

        const requestedCapabilities = { ...params.capabilities }
        const { sessionId, capabilities } = await startWebDriverSession(params)
        const environment = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        const environmentPrototype = getEnvironmentVars(environment)
        const protocolCommands = getPrototype(environment)
        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype }

        const monad = webdriverMonad(
            { ...params, requestedCapabilities },
            modifier,
            prototype
        )
        const client = monad(sessionId, customCommandWrapper)

        /**
         * if the server responded with direct connect information, update the
         * client options to speak directly to the appium host instead of a load
         * balancer (see https://github.com/appium/python-client#direct-connect-urls
         * for example). But only do this if the user has enabled this
         * behavior in the first place.
         */
        if (params.enableDirectConnect) {
            setupDirectConnect(client)
        }

        return client
    }

    /**
     * allows user to attach to existing sessions
     */
    static attachToSession (
        options?: AttachOptions,
        modifier?: (...args: any[]) => any,
        userPrototype = {},
        commandWrapper?: (...args: any[]) => any
    ): Client {
        if (!options || typeof options.sessionId !== 'string') {
            throw new Error('sessionId is required to attach to existing session')
        }

        // logLevel can be undefined in watch mode when SIGINT is called
        if (options.logLevel) {
            logger.setLevel('webdriver', options.logLevel)
        }

        options.capabilities = options.capabilities || {}
        options.isW3C = options.isW3C === false ? false : true
        options.protocol = options.protocol || DEFAULTS.protocol.default
        options.hostname = options.hostname || DEFAULTS.hostname.default
        options.port = options.port || DEFAULTS.port.default
        options.path = options.path || DEFAULTS.path.default

        const environmentPrototype = getEnvironmentVars(options as Partial<SessionFlags>)
        const protocolCommands = getPrototype(options as Partial<SessionFlags>)
        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype }
        const monad = webdriverMonad(options, modifier, prototype)
        return monad(options.sessionId, commandWrapper)
    }

    /**
     * Changes The instance session id and browser capabilities for the new session
     * directly into the passed in browser object
     *
     * @param   {Object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
    */
    static async reloadSession (instance: Client) {
        const params: Options.WebDriver = {
            ...instance.options,
            capabilities: instance.requestedCapabilities as Capabilities.DesiredCapabilities
        }
        const { sessionId, capabilities } = await startWebDriverSession(params)
        instance.sessionId = sessionId
        instance.capabilities = capabilities
        return sessionId
    }

    static get WebDriver () {
        return WebDriver
    }
}

/**
 * Helper methods consumed by webdriverio package
 */
export { getPrototype, DEFAULTS, command }
export * from './types'
