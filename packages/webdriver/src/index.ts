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
import { startWebDriverSession, getPrototype, getEnvironmentVars, setupDirectConnect, initiateBidi, parseBidiMessage, getBidiRequestOptions } from './utils.js'
import type { Client, AttachOptions, SessionFlags } from './types.js'

const log = logger('webdriver')

/**
 * client session with the protocol command surface that was derived from the
 * environment detection at session creation time. This is needed by
 * `reloadSession` to know which commands have been contributed by the protocols
 * so that the command surface can be rebuilt for a recreated session.
 */
interface SessionClient extends Client {
    __protocolCommandNames__?: string[]
}

const getProtocolCommandNames = (instance: SessionClient): string[] => instance.__protocolCommandNames__ ?? []

/**
 * stores the names of all commands contributed by the protocol definitions so
 * that `reloadSession` can remove commands that are no longer supported by the
 * new session and add the ones that are. Commands that are overridden by user
 * defined commands (e.g. `browser.throttleCPU` is provided by WebdriverIO but
 * also exists in the Sauce Labs protocol) are excluded as they are not owned by
 * the protocols and must not be removed on reload.
 */
const applyProtocolCommandNames = (client: Client, protocolCommands: Record<string, PropertyDescriptor>, userPrototype: Record<string, PropertyDescriptor>) => {
    ;(client as SessionClient).__protocolCommandNames__ = Object.keys(protocolCommands).filter((name) => !(name in userPrototype))
    return client
}

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
                options.headers,
                params.bidiResponseTimeout
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
        const client = applyProtocolCommandNames(monad(sessionId, customCommandWrapper, implicitWaitExclusionList), protocolCommands, userPrototype)

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
                options.headers,
                options.bidiResponseTimeout
            ))
        }

        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype, ...bidiPrototype }
        const monad = webdriverMonad(options, modifier, prototype)
        const client = applyProtocolCommandNames(monad(options.sessionId, commandWrapper), protocolCommands, userPrototype)

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
     * Changes The instance session id and browser capabilities for the new session
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
        if (!driverProcess?.pid) {
            instance.capabilities['wdio:driverPID'] = driverPid
        }
        Object.assign(instance.requestedCapabilities, capabilities)

        /**
         * re-run the environment detection based on the capabilities of the
         * replacement session and rebuild the protocol command surface of the
         * instance, e.g. the `isAppium` flag and the Appium commands have to be
         * refreshed when reloading between Appium and non-Appium sessions
         */
        const environment = sessionEnvironmentDetector({
            capabilities: newSessionCapabilities,
            requestedCapabilities: capabilities
        })
        const environmentPrototype = getEnvironmentVars(environment)
        const protocolCommands = getPrototype(environment)

        for (const [flag, descriptor] of Object.entries(environmentPrototype)) {
            Object.defineProperty(instance, flag, descriptor)
        }

        /**
         * remove protocol commands that are no longer supported by the new
         * session while keeping user defined commands untouched
         */
        const previousProtocolCommandNames = getProtocolCommandNames(instance)
        for (const commandName of previousProtocolCommandNames) {
            if (!(commandName in protocolCommands) && Object.prototype.hasOwnProperty.call(instance, commandName)) {
                delete instance[commandName]
            }
        }

        /**
         * add protocol commands that the new session contributes and that are
         * not already defined (e.g. by user defined commands)
         */
        const nextProtocolCommandNames: string[] = []
        for (const [commandName, descriptor] of Object.entries(protocolCommands)) {
            if (Object.prototype.hasOwnProperty.call(instance, commandName)) {
                if (previousProtocolCommandNames.includes(commandName)) {
                    nextProtocolCommandNames.push(commandName)
                }
                continue
            }
            Object.defineProperty(instance, commandName, descriptor)
            nextProtocolCommandNames.push(commandName)
        }
        ;(instance as SessionClient).__protocolCommandNames__ = nextProtocolCommandNames

        /**
         * reconnect to new Bidi session
         */
        if (isBidi(instance.capabilities || {})) {
            const bidiReqOpts = getBidiRequestOptions(instance.options.strictSSL, instance.options.headers)
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
