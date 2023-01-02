import os from 'node:os'
import path from 'node:path'
import UAParser from 'ua-parser-js'
import { v4 as uuidv4 } from 'uuid'

import logger from '@wdio/logger'
import { webdriverMonad, devtoolsEnvironmentDetector } from '@wdio/utils'
import { validateConfig } from '@wdio/config'
import type { CommandEndpoint } from '@wdio/protocols'
import type { Options, Capabilities } from '@wdio/types'
import type { Browser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser.js'

import DevToolsDriver from './devtoolsdriver.js'
import launch from './launcher.js'
import { DEFAULTS, SUPPORTED_BROWSER, VENDOR_PREFIX } from './constants.js'
import { getPrototype, patchDebug } from './utils.js'
import type {
    Client,
    AttachOptions,
    ExtendedCapabilities,
    WDIODevtoolsOptions as WDIODevtoolsOptionsExtension
} from './types.js'

const log = logger('devtools:puppeteer')

/**
 * patch debug package to log Puppeteer CDP messages
 */
await patchDebug(log)

export const sessionMap = new Map()

export default class DevTools {
    static async newSession (
        options: Options.WebDriver,
        modifier?: Function,
        userPrototype = {},
        customCommandWrapper?: Function
    ): Promise<Client> {
        const params = validateConfig(DEFAULTS, options)

        if (params.logLevel && (!options.logLevels || !(options.logLevels as any).devtools)) {
            logger.setLevel('devtools', params.logLevel)
        }

        /**
         * Store all log events in a file
         */
        if (params.outputDir && !process.env.WDIO_LOG_PATH) {
            process.env.WDIO_LOG_PATH = path.join(params.outputDir, 'wdio.log')
        }

        log.info('Initiate new session using the DevTools protocol')

        const requestedCapabilities = { ...params.capabilities }
        const browser = await launch(params.capabilities as ExtendedCapabilities)
        const pages = await browser.pages()
        const driver = new DevToolsDriver(browser, pages)
        const sessionId = uuidv4()
        const uaParser = new UAParser(await browser.userAgent())
        const userAgent = uaParser.getResult()

        /**
         * find vendor key in capabilities
         */
        type ValueOf<T> = T[keyof T]
        const availableVendorPrefixes = Object.values(VENDOR_PREFIX)
        const vendorCapPrefix = Object.keys(params.capabilities as Capabilities.Capabilities)
            .find(
                (capKey: ValueOf<typeof VENDOR_PREFIX>) => availableVendorPrefixes.includes(capKey)
            ) as keyof Capabilities.Capabilities
            ||
            VENDOR_PREFIX[userAgent.browser.name?.toLocaleLowerCase() as keyof typeof VENDOR_PREFIX]

        const { browserName } = (requestedCapabilities as Capabilities.W3CCapabilities).alwaysMatch || requestedCapabilities
        params.capabilities = {
            browserName: (userAgent.browser.name || browserName || 'unknown').split(' ').shift()?.toLowerCase(),
            browserVersion: userAgent.browser.version,
            platformName: os.platform(),
            platformVersion: os.release()
        }

        if (vendorCapPrefix) {
            Object.assign(params.capabilities, {
                [vendorCapPrefix]: Object.assign(
                    { debuggerAddress: browser.wsEndpoint().split('/')[2] },
                    params.capabilities[vendorCapPrefix]
                )
            })
        }

        sessionMap.set(sessionId, { browser, session: driver })
        const environmentPrototype: Record<string, { value: any }> = {}
        Object.entries(devtoolsEnvironmentDetector({
            browserName: userAgent?.browser?.name?.toLowerCase()
        })).forEach(([name, value]) => {
            environmentPrototype[name] = { value }
        })
        const commandWrapper = (
            method: string,
            endpoint: string,
            commandInfo: CommandEndpoint
        ) => driver.register(commandInfo)
        const protocolCommands = getPrototype(commandWrapper)
        const prototype = {
            ...protocolCommands,
            ...userPrototype,
            ...environmentPrototype
        }

        const monad = webdriverMonad(
            { ...params, requestedCapabilities },
            modifier,
            prototype
        )
        return monad(sessionId, customCommandWrapper)
    }

    /**
     * Changes The instance session id and browser capabilities for the new session
     * directly into the passed in browser object
     *
     * @param   {object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static async reloadSession (instance: any): Promise<string> {
        const { session } = sessionMap.get(instance.sessionId)
        const browser = await launch(instance.requestedCapabilities)
        const pages = await browser.pages()
        session.initBrowser.call(session, browser, pages)
        instance.puppeteer = browser
        sessionMap.set(instance.sessionId, { browser, session })
        return instance.sessionId
    }

    /**
     * allows user to attach to existing sessions
     */
    static async attachToSession (
        options: AttachOptions,
        modifier?: Function,
        userPrototype = {},
        customCommandWrapper?: Function
    ): Promise<Client> {
        const browser = await launch(options.capabilities as ExtendedCapabilities)
        const pages = await browser.pages()
        const driver = new DevToolsDriver(browser, pages)
        const sessionId = uuidv4()
        const uaParser = new UAParser(await browser.userAgent())
        const userAgent = uaParser.getResult()

        const environmentPrototype: Record<string, { value: Browser | boolean }> = { puppeteer: { value: browser } }
        Object.entries(devtoolsEnvironmentDetector({
            browserName: userAgent?.browser?.name?.toLowerCase()
        })).forEach(([name, value]) => {
            environmentPrototype[name] = { value }
        })
        const commandWrapper = (
            method: string,
            endpoint: string,
            commandInfo: CommandEndpoint
        ) => driver.register(commandInfo)
        const protocolCommands = getPrototype(commandWrapper)
        const prototype = {
            ...protocolCommands,
            ...userPrototype,
            ...environmentPrototype
        }

        const monad = webdriverMonad(
            options,
            modifier,
            prototype
        )
        return monad(sessionId, customCommandWrapper)
    }
}

export { SUPPORTED_BROWSER }
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface WDIODevtoolsOptions extends WDIODevtoolsOptionsExtension {}
    }
}
