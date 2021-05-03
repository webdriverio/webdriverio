import { launch as launchChromeBrowser } from 'chrome-launcher'
import puppeteer from 'puppeteer-core'
import logger from '@wdio/logger'
import type { Browser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'
import type { Capabilities } from '@wdio/types'
import { QueryHandler } from 'query-selector-shadow-dom/plugins/puppeteer'

import browserFinder from './finder'
import { getPages } from './utils'
import {
    CHROME_NAMES,
    FIREFOX_NAMES,
    EDGE_NAMES,
    BROWSER_TYPE,
    DEFAULT_FLAGS,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_X_POSITION,
    DEFAULT_Y_POSITION,
    VENDOR_PREFIX,
    CHANNEL_FIREFOX_NIGHTLY,
    CHANNEL_FIREFOX_TRUNK,
    BROWSER_ERROR_MESSAGES
} from './constants'
import type { ExtendedCapabilities } from './types'

const log = logger('devtools')

const DEVICE_NAMES = Object.values(puppeteer.devices).map((device) => device.name)

/**
 * launches Chrome and returns a Puppeteer browser instance
 * @param  {object} capabilities  session capabilities
 * @return {object}               puppeteer browser instance
 */
async function launchChrome (capabilities: ExtendedCapabilities) {
    const chromeOptions: Capabilities.ChromeOptions = capabilities[VENDOR_PREFIX.chrome] || {}
    const mobileEmulation = chromeOptions.mobileEmulation || {}
    const devtoolsOptions = capabilities['wdio:devtoolsOptions'] || {}

    /**
     * `ignoreDefaultArgs` and `headless` are currently expected to be part of the capabilities
     * but we should move them into a custom capability object, e.g. `wdio:devtoolsOptions`.
     * This should be cleaned up for v7 release
     * ToDo(Christian): v7 cleanup
     */
    let ignoreDefaultArgs = (capabilities as any).ignoreDefaultArgs || devtoolsOptions.ignoreDefaultArgs
    let headless = (chromeOptions as any).headless || devtoolsOptions.headless

    if (typeof mobileEmulation.deviceName === 'string') {
        const deviceProperties = Object.values(puppeteer.devices).find(device => device.name === mobileEmulation.deviceName)

        if (!deviceProperties) {
            throw new Error(`Unknown device name "${mobileEmulation.deviceName}", available: ${DEVICE_NAMES.join(', ')}`)
        }

        mobileEmulation.userAgent = deviceProperties.userAgent
        mobileEmulation.deviceMetrics = {
            width: deviceProperties.viewport.width,
            height: deviceProperties.viewport.height,
            pixelRatio: deviceProperties.viewport.deviceScaleFactor
        }
    }

    const defaultFlags = Array.isArray(ignoreDefaultArgs) ? DEFAULT_FLAGS.filter(flag => !ignoreDefaultArgs.includes(flag)) : (!ignoreDefaultArgs) ? DEFAULT_FLAGS : []
    const deviceMetrics = mobileEmulation.deviceMetrics || {}
    const chromeFlags = [
        ...defaultFlags,
        ...[
            `--window-position=${DEFAULT_X_POSITION},${DEFAULT_Y_POSITION}`,
            `--window-size=${DEFAULT_WIDTH},${DEFAULT_HEIGHT}`
        ],
        ...(headless ? [
            '--headless',
            '--no-sandbox'
        ] : []),
        ...(chromeOptions.args || [])
    ]

    if (typeof deviceMetrics.pixelRatio === 'number') {
        chromeFlags.push(`--device-scale-factor=${deviceMetrics.pixelRatio}`)
    }

    if (typeof mobileEmulation.userAgent === 'string') {
        chromeFlags.push(`--user-agent=${mobileEmulation.userAgent}`)
    }

    log.info(`Launch Google Chrome with flags: ${chromeFlags.join(' ')}`)
    const chrome = await launchChromeBrowser({
        chromePath: chromeOptions.binary,
        ignoreDefaultFlags: true,
        chromeFlags,
        ...(devtoolsOptions.customPort ? { port: devtoolsOptions.customPort } : {})
    })

    log.info(`Connect Puppeteer with browser on port ${chrome.port}`)
    const browser = await puppeteer.connect({
        ...chromeOptions,
        defaultViewport: null,
        browserURL: `http://localhost:${chrome.port}`
    }) as unknown as Browser // casting from @types/puppeteer to built in type

    /**
     * when using Chrome Launcher we have to close a tab as Puppeteer
     * creates automatically a new one
     */
    const pages = await getPages(browser)
    for (const page of pages.slice(0, -1)) {
        if (page.url() === 'about:blank') {
            await page.close()
        }
    }

    if (deviceMetrics.width && deviceMetrics.height) {
        await pages[0].setViewport(deviceMetrics)
    }

    return browser
}

function launchBrowser (capabilities: ExtendedCapabilities, browserType: 'edge' | 'firefox') {
    const product = browserType === BROWSER_TYPE.firefox ? BROWSER_TYPE.firefox : BROWSER_TYPE.chrome
    const vendorCapKey = VENDOR_PREFIX[browserType]
    const devtoolsOptions = capabilities['wdio:devtoolsOptions']

    /**
     * `ignoreDefaultArgs` and `headless` are currently expected to be part of the capabilities
     * but we should move them into a custom capability object, e.g. `wdio:devtoolsOptions`.
     * This should be cleaned up for v7 release
     * ToDo(Christian): v7 cleanup
     */
    let ignoreDefaultArgs = (capabilities as any).ignoreDefaultArgs
    let headless = (capabilities as any).headless
    if (devtoolsOptions) {
        ignoreDefaultArgs = devtoolsOptions.ignoreDefaultArgs
        headless = devtoolsOptions.headless
    }

    if (!capabilities[vendorCapKey]) {
        capabilities[vendorCapKey] = {}
    }

    const browserFinderMethod = browserFinder(browserType, process.platform)
    const executablePath = (
        capabilities[vendorCapKey]?.binary ||
        browserFinderMethod()[0]
    )

    const puppeteerOptions = Object.assign({
        product,
        executablePath,
        ignoreDefaultArgs,
        headless: Boolean(headless),
        defaultViewport: {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT
        }
    }, capabilities[vendorCapKey] || {}, devtoolsOptions || {})

    if (!executablePath) {
        throw new Error('Couldn\'t find executable for browser')
    } else if (
        browserType === BROWSER_TYPE.firefox &&
        executablePath !== 'firefox' &&
        !executablePath.toLowerCase().includes(CHANNEL_FIREFOX_NIGHTLY) &&
        !executablePath.toLowerCase().includes(CHANNEL_FIREFOX_TRUNK)
    ) {
        throw new Error(BROWSER_ERROR_MESSAGES.firefoxNightly)
    }

    log.info(`Launch ${executablePath} with config: ${JSON.stringify(puppeteerOptions)}`)
    return puppeteer.launch(puppeteerOptions) as unknown as Promise<Browser>
}

function connectBrowser (connectionUrl: string, capabilities: ExtendedCapabilities) {
    const connectionProp = connectionUrl.startsWith('http') ? 'browserURL' : 'browserWSEndpoint'
    const devtoolsOptions = capabilities['wdio:devtoolsOptions']
    const options: puppeteer.ConnectOptions = {
        [connectionProp]: connectionUrl,
        ...devtoolsOptions
    }
    return puppeteer.connect(options) as unknown as Promise<Browser>
}

export default async function launch (capabilities: ExtendedCapabilities) {
    puppeteer.unregisterCustomQueryHandler('shadow')
    puppeteer.registerCustomQueryHandler('shadow', QueryHandler)
    const browserName = capabilities.browserName?.toLowerCase()

    /**
     * check if capabilities already contains connection details and connect
     * to that rather than starting a new browser
     */
    const browserOptions = capabilities['goog:chromeOptions'] || capabilities['ms:edgeOptions']
    const devtoolsOptions = capabilities['wdio:devtoolsOptions'] || {}
    const connectionUrl = (
        (browserOptions?.debuggerAddress && `http://${browserOptions?.debuggerAddress}`) ||
        devtoolsOptions.browserURL ||
        devtoolsOptions.browserWSEndpoint
    )
    if (connectionUrl) {
        return connectBrowser(connectionUrl, capabilities)
    }

    if (browserName && CHROME_NAMES.includes(browserName)) {
        return launchChrome(capabilities)
    }

    if (browserName && FIREFOX_NAMES.includes(browserName)) {
        return launchBrowser(capabilities, BROWSER_TYPE.firefox)
    }

    /* istanbul ignore next */
    if (browserName && EDGE_NAMES.includes(browserName)) {
        return launchBrowser(capabilities, BROWSER_TYPE.edge)
    }

    throw new Error(`Couldn't identify browserName "${browserName}"`)
}
