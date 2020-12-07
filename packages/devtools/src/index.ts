import os from 'os'
import UAParser from 'ua-parser-js'
import { v4 as uuidv4 } from 'uuid'

import logger from '@wdio/logger'
import { webdriverMonad, devtoolsEnvironmentDetector } from '@wdio/utils'
import { validateConfig } from '@wdio/config'
import type { Browser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'

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
    static async newSession (options: WebDriver.Options = {}, modifier?: Function, userPrototype = {}, customCommandWrapper?: Function) {
        const params = validateConfig(DEFAULTS, options)

        if (params.logLevel && (!options.logLevels || !(options.logLevels as any)['devtools'])) {
            logger.setLevel('devtools', params.logLevel)
        }

        const browser = await launch(params.capabilities as WebDriver.Capabilities)
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
        const vendorCapPrefix = Object.keys(params.capabilities as WebDriver.Capabilities)
            .find(
                (capKey: ValueOf<typeof VENDOR_PREFIX>) => availableVendorPrefixes.includes(capKey)
            ) as keyof WebDriver.Capabilities

        /**
         * save original set of capabilities to allow to request the same session again
         * (e.g. for reloadSession command in WebdriverIO)
         */
        params.requestedCapabilities = { ...params.capabilities }

        params.capabilities = {
            browserName: userAgent.browser.name,
            browserVersion: userAgent.browser.version,
            platformName: os.platform(),
            platformVersion: os.release()
        }

        if (vendorCapPrefix) {
            Object.assign(params.capabilities, {
                [vendorCapPrefix]: Object.assign(
                    { debuggerAddress: (browser as any)._connection.url().split('/')[2] },
                    params.capabilities[vendorCapPrefix]
                )
            })
        }

        sessionMap.set(sessionId, { browser, session: driver })
        const environmentPrototype: Record<string, { value: Browser | boolean }> = { puppeteer: { value: browser } }
        Object.entries(devtoolsEnvironmentDetector({
            browserName: userAgent?.browser?.name?.toLowerCase()
        })).forEach(([name, value]) => {
            environmentPrototype[name] = { value }
        })
        const commandWrapper = (
            method: string,
            endpoint: string,
            commandInfo: WDIOProtocols.CommandEndpoint
        ) => driver.register(commandInfo)
        const protocolCommands = getPrototype(commandWrapper)
        const prototype = {
            ...protocolCommands,
            ...userPrototype,
            ...environmentPrototype
        }

        const monad = webdriverMonad(params, modifier, prototype)
        return monad(sessionId, customCommandWrapper)
    }

    static async reloadSession (instance: WebdriverIO.BrowserObject) {
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
