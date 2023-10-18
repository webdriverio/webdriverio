import logger from '@wdio/logger'

import { webdriverMonad, sessionEnvironmentDetector, startWebDriver } from '@wdio/utils'
import { validateConfig } from '@wdio/config'
import type { Options, Capabilities } from '@wdio/types'

import command from './command.js'
import { BidiHandler } from './bidi/handler.js'
import { DEFAULTS } from './constants.js'
import { startWebDriverSession, getPrototype, getEnvironmentVars, setupDirectConnect } from './utils.js'
import type { Client, AttachOptions, SessionFlags } from './types.js'

const log = logger('webdriver')

export default class WebDriver {
    static async newSession(
        options: Options.WebDriver,
        modifier?: (...args: any[]) => any,
        userPrototype = {},
        customCommandWrapper?: (...args: any[]) => any
    ): Promise<Client> {
        const envLogLevel = process.env.WDIO_LOG_LEVEL as Options.WebDriverLogTypes | undefined
        options.logLevel = envLogLevel ?? options.logLevel
        const params = validateConfig(DEFAULTS, options)

        if (params.logLevel && (!options.logLevels || !options.logLevels.webdriver)) {
            logger.setLevel('webdriver', params.logLevel)
        }

        log.info('Initiate new session using the WebDriver protocol')
        const driverProcess = await startWebDriver(params)
        const requestedCapabilities = { ...params.capabilities }
        const { sessionId, capabilities } = await startWebDriverSession(params)
        const environment = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        const environmentPrototype = getEnvironmentVars(environment)
        const protocolCommands = getPrototype(environment)
        const driverPrototype: Record<string, PropertyDescriptor> = {
            _driverProcess: { value: driverProcess, configurable: false, writable: true }
        }

        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype, ...driverPrototype }
        const monad = webdriverMonad(
            { ...params, requestedCapabilities },
            modifier,
            prototype
        )

        let handler: BidiHandler | undefined
        if (capabilities.webSocketUrl) {
            log.info(`Register BiDi handler for session with id ${sessionId}`)
            const socketUrl = (capabilities.webSocketUrl as any as string).replace('localhost', '127.0.0.1')
            handler = new BidiHandler(socketUrl)
            await handler.connect()
        }
        const client = monad(sessionId, customCommandWrapper, handler)

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
    static attachToSession(
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
        const environment = sessionEnvironmentDetector({ capabilities: options.capabilities, requestedCapabilities: options.capabilities })
        options = Object.assign(environment, options)

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
     * @param   {object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static async reloadSession(instance: Client) {
        const params: Options.WebDriver = {
            ...instance.options,
            capabilities: instance.requestedCapabilities as Capabilities.DesiredCapabilities
        }
        const { sessionId, capabilities } = await startWebDriverSession(params)
        instance.sessionId = sessionId
        instance.capabilities = capabilities
        return sessionId
    }

    static get WebDriver() {
        return WebDriver
    }
}

/**
 * Helper methods consumed by webdriverio package
 */
export { getPrototype, DEFAULTS, command, getEnvironmentVars }
export * from './types.js'
export * from './bidi/handler.js'
export * as local from './bidi/localTypes.js'
export * as remote from './bidi/remoteTypes.js'
