import type { ChildProcess } from 'node:child_process'

import logger from '@wdio/logger'

import { webdriverMonad, sessionEnvironmentDetector, startWebDriver } from '@wdio/utils'
import { validateConfig } from '@wdio/config'
import { deepmerge } from 'deepmerge-ts'
import type { Options } from '@wdio/types'

import command from './command.js'
import { DEFAULTS } from './constants.js'
import { startWebDriverSession, getPrototype, getEnvironmentVars, setupDirectConnect, initiateBidi, parseBidiMessage } from './utils.js'
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

        /**
         * attach driver process to instance capabilities so we can kill the driver process
         * even after attaching to this session
         */
        if (driverProcess?.pid) {
            capabilities['wdio:driverPID'] = driverProcess.pid
        }

        /**
         * initiate WebDriver Bidi
         */
        const bidiPrototype: PropertyDescriptorMap = {}
        if (capabilities.webSocketUrl) {
            log.info(`Register BiDi handler for session with id ${sessionId}`)
            Object.assign(bidiPrototype, initiateBidi(capabilities.webSocketUrl as any as string, options.strictSSL))
        }

        const monad = webdriverMonad(
            { ...params, requestedCapabilities },
            modifier,
            {
                ...protocolCommands,
                ...environmentPrototype,
                ...userPrototype,
                ...bidiPrototype
            }
        )
        const client = monad(sessionId, customCommandWrapper)

        /**
         * parse and propagate all Bidi events to the browser instance
         */
        if (capabilities.webSocketUrl) {
            // make sure the Bidi connection is established before returning
            await client._bidiHandler.connect()
            client._bidiHandler?.socket.on('message', parseBidiMessage.bind(client))
        }

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

        /**
         * initiate WebDriver Bidi
         */
        const bidiPrototype: PropertyDescriptorMap = {}
        const webSocketUrl = 'alwaysMatch' in options.capabilities!
            ? options.capabilities.alwaysMatch?.webSocketUrl
            : options.capabilities!.webSocketUrl
        if (webSocketUrl) {
            log.info(`Register BiDi handler for session with id ${options.sessionId}`)
            Object.assign(bidiPrototype, initiateBidi(webSocketUrl as any as string, options.strictSSL))
        }

        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype, ...bidiPrototype }
        const monad = webdriverMonad(options, modifier, prototype)
        const client = monad(options.sessionId, commandWrapper)

        /**
         * parse and propagate all Bidi events to the browser instance
         */
        if (webSocketUrl) {
            client._bidiSocket?.on('message', parseBidiMessage.bind(client))
        }
        return client
    }

    /**
     * Changes The instance session id and browser capabilities for the new session
     * directly into the passed in browser object
     *
     * @param   {object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static async reloadSession(instance: Client, newCapabilities?: WebdriverIO.Capabilities) {
        const capabilities = deepmerge(instance.requestedCapabilities, newCapabilities || {})
        const params: Options.WebDriver = { ...instance.options, capabilities }

        let driverProcess: ChildProcess | undefined
        if (newCapabilities?.browserName) {
            delete params.port
            delete params.hostname
            driverProcess = await startWebDriver(params)
        }

        const { sessionId, capabilities: newSessionCapabilities } = await startWebDriverSession(params)

        /**
         * attach driver process to instance capabilities so we can kill the driver process
         * even after attaching to this session
         */
        if (driverProcess?.pid) {
            newSessionCapabilities['wdio:driverPID'] = driverProcess.pid
        }

        instance.options.hostname = params.hostname
        instance.options.port = params.port
        instance.sessionId = sessionId
        instance.capabilities = newSessionCapabilities
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
export * from './constants.js'
export * from './bidi/handler.js'
export * as local from './bidi/localTypes.js'
export * as remote from './bidi/remoteTypes.js'
