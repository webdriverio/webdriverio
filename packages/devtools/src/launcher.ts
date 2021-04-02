import { launch as launchChromeBrowser } from 'chrome-launcher'
import puppeteer from 'puppeteer-core'
import logger from '@wdio/logger'
import type { Browser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'
import type { Capabilities } from '@wdio/types'

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
    const devtoolsOptions = capabilities['wdio:devtoolsOptions']

    /**
     * `ignoreDefaultArgs` and `headless` are currently expected to be part of the capabilities
     * but we should move them into a custom capability object, e.g. `wdio:devtoolsOptions`.
     * This should be cleaned up for v7 release
     * ToDo(Christian): v7 cleanup
     */
    let ignoreDefaultArgs = (capabilities as any).ignoreDefaultArgs

    let debuggerAddress = chromeOptions.debuggerAddress
    let port
    if (debuggerAddress) {
        const requestedPort = debuggerAddress.split(':')[1]
        port = parseInt(requestedPort, 10)
    }

    let headless = (chromeOptions as any).headless

    if (devtoolsOptions) {
        ignoreDefaultArgs = devtoolsOptions.ignoreDefaultArgs
        headless = devtoolsOptions.headless
    }

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

    if (port) {
        log.info(`Requesting to connect to Google Chrome on port: ${port}`)
    }
    log.info(`Launch Google Chrome with flags: ${chromeFlags.join(' ')}`)

    const chrome = await launchChromeBrowser({
        chromePath: chromeOptions.binary,
        ignoreDefaultFlags: true,
        chromeFlags,
        ...(port ? { port } : {})
    })

    log.info(`Connect Puppeteer with browser on port ${chrome.port}`)
    const browser = await puppeteer.connect({
        ...chromeOptions,
        browserURL: `http://localhost:${chrome.port}`,
        // @ts-ignore ToDo(@L0tso): remove once https://github.com/puppeteer/puppeteer/pull/6942 is merged
        defaultViewport: null
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

function connectBrowser (browserURL: string) {
    return puppeteer.connect({ browserURL }) as unknown as Promise<Browser>
}

export default function launch (capabilities: ExtendedCapabilities) {
    const browserName = capabilities.browserName?.toLowerCase()

    /**
     * check if capabilities already contains connection details and connect
     * to that rather than starting a new browser
     */
    const browserOptions = capabilities['goog:chromeOptions'] || capabilities['ms:edgeOptions']
    if (browserOptions?.debuggerAddress && !capabilities['wdio:devtoolsOptions']?.customDebuggerAddress) {
        return connectBrowser(`http://${browserOptions?.debuggerAddress}`)
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
