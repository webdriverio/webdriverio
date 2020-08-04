import os from 'os'
import uaParserJs from 'ua-parser-js'
import { v4 as uuidv4 } from 'uuid'

import logger from '@wdio/logger'
import { webdriverMonad, devtoolsEnvironmentDetector } from '@wdio/utils'
import { validateConfig } from '@wdio/config'

import DevToolsDriver from './devtoolsdriver'
import launch from './launcher'
import { DEFAULTS, SUPPORTED_BROWSER, VENDOR_PREFIX } from './constants'
import { getPrototype, patchDebug } from './utils'

const log = logger('devtools:puppeteer')

/**
 * patch debug package to log Puppeteer CDP messages
 */
patchDebug(log)

export const sessionMap = new Map()

export default class DevTools {
    static async newSession (options = {}, modifier, userPrototype = {}, customCommandWrapper) {
        const params = validateConfig(DEFAULTS, options)

        if (!options.logLevels || !options.logLevels['devtools']) {
            logger.setLevel('devtools', params.logLevel)
        }

        const browser = await launch(params.capabilities)
        const pages = await browser.pages()
        const driver = new DevToolsDriver(browser, pages)
        const sessionId = uuidv4()
        const userAgent = uaParserJs(await browser.userAgent())

        /**
         * find vendor key in capabilities
         */
        const availableVendorPrefixes = Object.values(VENDOR_PREFIX)
        const vendorCapPrefix = Object.keys(params.capabilities).find(
            (capKey) => availableVendorPrefixes.includes(capKey))

        /**
         * save original set of capabilities to allow to request the same session again
         * (e.g. for reloadSession command in WebdriverIO)
         */
        params.requestedCapabilities = { ...params.capabilities }

        params.capabilities = {
            browserName: userAgent.browser.name,
            browserVersion: userAgent.browser.version,
            platformName: os.platform(),
            platformVersion: os.release(),
            [vendorCapPrefix]: Object.assign(
                { debuggerAddress: browser._connection.url().split('/')[2] },
                params.capabilities[vendorCapPrefix]
            )
        }

        sessionMap.set(sessionId, { browser, session: driver })
        const environmentPrototype = { puppeteer: { value: browser } }
        Object.entries(devtoolsEnvironmentDetector({ browserName: userAgent.browser.name.toLowerCase() })).forEach(([name, value]) => {
            environmentPrototype[name] = { value }
        })
        const commandWrapper = (_, __, commandInfo) => driver.register(commandInfo)
        const protocolCommands = getPrototype(commandWrapper)
        const prototype = { ...protocolCommands, ...userPrototype, ...environmentPrototype }

        const monad = webdriverMonad(params, modifier, prototype)
        return monad(sessionId, customCommandWrapper)
    }

    static async reloadSession (instance) {
        const { session } = sessionMap.get(instance.sessionId)
        const browser = await launch(instance.requestedCapabilities)
        const pages = await browser.pages()

        session.elementStore.clear()
        session.windows = new Map()
        session.browser = browser

        for (const page of pages) {
            const pageId = uuidv4()
            session.windows.set(pageId, page)
            session.currentWindowHandle = pageId
        }

        sessionMap.set(instance.sessionId, { browser, session })
        return instance.sessionId
    }

    /**
     * allows user to attach to existing sessions
     */
    /* istanbul ignore next */
    static attachToSession () {
        throw new Error('not yet implemented')
    }
}

export { SUPPORTED_BROWSER }
