import path from 'path'
import logger from '@wdio/logger'

import { webdriverMonad, sessionEnvironmentDetector } from '@wdio/utils'
import { validateConfig } from '@wdio/config'

import { DEFAULTS } from './constants'
import { startWebDriverSession, getPrototype, getEnvironmentVars } from './utils'
import type {
    Options, Client, AttachOptions, SessionFlags,
    DesiredCapabilities
} from './types'

const log = logger('webdriver')

export default class WebDriver {
    static async newSession (
        options: Options,
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

        /**
         * if the server responded with direct connect information, update the
         * params to speak directly to the appium host instead of a load
         * balancer (see https://github.com/appium/python-client#direct-connect-urls
         * for example). But only do this if the user has enabled this
         * behavior in the first place.
         */
        const { directConnectProtocol, directConnectHost, directConnectPort, directConnectPath } = params
        if (directConnectProtocol && directConnectHost && directConnectPort && (directConnectPath || directConnectPath === '')) {
            log.info('Found direct connect information in new session response. ' +
                `Will connect to server at ${directConnectProtocol}://${directConnectHost}:${directConnectPort}/${directConnectPath}`)
            params.protocol = directConnectProtocol
            params.hostname = directConnectHost
            params.port = directConnectPort
            params.path = directConnectPath
        }

        const { sessionId, capabilities } = await startWebDriverSession(params)
        const environment = sessionEnvironmentDetector({ capabilities, requestedCapabilities: params.capabilities })
        const environmentPrototype = getEnvironmentVars(environment)
        const protocolCommands = getPrototype(environment)
        const prototype = { ...protocolCommands, ...environmentPrototype, ...userPrototype }

        const monad = webdriverMonad(
            { ...params, requestedCapabilities: params.capabilities },
            modifier,
            prototype
        )
        return monad(sessionId, customCommandWrapper)
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
        if (options.logLevel !== undefined) {
            logger.setLevel('webdriver', options.logLevel)
        }

        options.capabilities = options.capabilities || {}
        options.isW3C = options.isW3C === false ? false : true

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
        const params: Options = {
            ...instance.options,
            capabilities: instance.requestedCapabilities as DesiredCapabilities
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
export { getPrototype, DEFAULTS }
export * from './types'
