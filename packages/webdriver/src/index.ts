/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ChildProcess } from 'node:child_process'

import logger from '@wdio/logger'

import { webdriverMonad, sessionEnvironmentDetector, startWebDriver, isBidi } from '@wdio/utils'
import { validateConfig } from '@wdio/config'
import type { Capabilities, Options } from '@wdio/types'

import command from './command.js'
import { DEFAULTS } from './constants.js'
import type { BidiHandler } from './bidi/handler.js'
import { environment as environmentValue } from './environment.js'
import { startWebDriverSession, getPrototype, getEnvironmentVars, setupDirectConnect, initiateBidi, parseBidiMessage } from './utils.js'
import type { Client, AttachOptions, SessionFlags } from './types.js'

const log = logger('webdriver')

export default class WebDriver {
    static async newSession(
        options: Capabilities.RemoteConfig,
        modifier?: (...args: any[]) => any,
        userPrototype = {},
        customCommandWrapper?: (...args: any[]) => any,
        implicitWaitExclusionList: string[] = []
    ): Promise<Client> {
        const envLogLevel = environmentValue.value.variables.WDIO_LOG_LEVEL
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
        if (isBidi(capabilities)) {
            log.info(`Register BiDi handler for session with id ${sessionId}`)
            Object.assign(bidiPrototype, initiateBidi(
                capabilities.webSocketUrl as unknown as string,
                options.strictSSL,
                options.headers
            ))
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
        const client = monad(sessionId, customCommandWrapper, implicitWaitExclusionList)

        /**
         * parse and propagate all Bidi events to the browser instance
         */
        if (isBidi(capabilities)) {
            /**
             * make sure the Bidi connection is established before returning
             */
            if (await client._bidiHandler.waitForConnected()) {
                client._bidiHandler.socket?.on('message', parseBidiMessage.bind(client))
            }
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
        if (isBidi(options.capabilities || {})) {
            const webSocketUrl = options.capabilities?.webSocketUrl as unknown as string
            log.info(`Register BiDi handler for session with id ${options.sessionId}`)
            Object.assign(bidiPrototype, initiateBidi(
                webSocketUrl as string,
                options.strictSSL,
                options.headers
            ))
        }

        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype, ...bidiPrototype }
        const monad = webdriverMonad(options, modifier, prototype)
        const client = monad(options.sessionId, commandWrapper)

        /**
         * parse and propagate all Bidi events to the browser instance
         */
        if (isBidi(options.capabilities || {})) {
            client._bidiHandler?.waitForConnected().then(()=>{
                client._bidiHandler?.socket.on('message', parseBidiMessage.bind(client))
            })
        }
        return client
    }

    /**
     * Changes the instance session id and browser capabilities for the new session
     * directly into the passed in browser object
     *
     * @param   {object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static async reloadSession(instance: Client & { _bidiHandler?: BidiHandler }, newCapabilities?: WebdriverIO.Capabilities) {
        const capabilities = newCapabilities ? newCapabilities : Object.assign({}, instance.requestedCapabilities) as WebdriverIO.Capabilities
        let params: Capabilities.RemoteConfig = { ...instance.options, capabilities }

        for (const prop of ['protocol', 'hostname', 'port', 'path', 'queryParams', 'user', 'key'] as (keyof Options.Connection)[]) {
            if (prop in capabilities) {
                params = { ...params, [prop]: capabilities[prop] }
                delete capabilities[prop]
            }
        }

        /**
         * if we have been running a local session before, delete connection details
         * in order to start a new session on a potential new driver
         */
        let driverProcess: ChildProcess | undefined
        if (params.hostname === 'localhost' && newCapabilities?.browserName) {
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

        for (const prop of ['protocol', 'hostname', 'port', 'path', 'queryParams', 'user', 'key'] as (keyof Options.Connection)[]) {
            if (prop in params) {
                (<typeof prop>instance.options[prop]) = params[prop] as typeof prop
            }
        }
        for (const prop in instance.requestedCapabilities) {
            delete instance.requestedCapabilities[prop as keyof typeof instance.requestedCapabilities]
        }

        const driverPid = instance.capabilities['wdio:driverPID']
        instance.sessionId = sessionId
        instance.capabilities = newSessionCapabilities
        instance.capabilities['wdio:driverPID'] = driverPid
        Object.assign(instance.requestedCapabilities, capabilities)

        /**
         * reconnect to new Bidi session
         */
        if (isBidi(instance.capabilities || {})) {
            const bidiReqOpts = instance.options.strictSSL ? {} : { rejectUnauthorized: false }
            await instance._bidiHandler?.reconnect(newSessionCapabilities.webSocketUrl as unknown as string, bidiReqOpts)
            instance._bidiHandler?.socket?.on('message', parseBidiMessage.bind(instance))
        }

        return sessionId
    }

    static get WebDriver() {
        return WebDriver
    }
}

/**
 * Helper methods consumed by webdriverio package
 */
export { getPrototype, DEFAULTS, command, getEnvironmentVars, initiateBidi, parseBidiMessage, WebDriver }
export * from './types.js'
export * from './constants.js'
export * from './bidi/handler.js'
export * as local from './bidi/localTypes.js'
export * as remote from './bidi/remoteTypes.js'
