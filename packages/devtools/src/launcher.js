import { launch as launchChromeBrowser } from 'chrome-launcher'
import puppeteer from 'puppeteer-core'
import DEVICES from 'puppeteer-core/DeviceDescriptors'
import logger from '@wdio/logger'

import { getPages } from './utils'
import {
    CHROME_NAMES, FIREFOX_NAMES, EDGE_NAMES, DEFAULT_FLAGS, DEFAULT_WIDTH,
    DEFAULT_HEIGHT, DEFAULT_X_POSITION, DEFAULT_Y_POSITION, VENDOR_PREFIX
} from './constants'

const log = logger('devtools')

const DEVICE_NAMES = Object.values(DEVICES).map((device) => device.name)

/**
 * launches Chrome and returns a Puppeteer browser instance
 * @param  {object} capabilities  session capabilities
 * @return {object}               puppeteer browser instance
 */
async function launchChrome (capabilities) {
    const chromeOptions = capabilities[VENDOR_PREFIX.chrome] || {}
    const mobileEmulation = chromeOptions.mobileEmulation || {}

    if (typeof mobileEmulation.deviceName === 'string') {
        const deviceProperties = Object.values(DEVICES).find(device => device.name === mobileEmulation.deviceName)
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

    const deviceMetrics = mobileEmulation.deviceMetrics || {}
    const chromeFlags = [
        ...DEFAULT_FLAGS,
        ...[
            `--window-position=${DEFAULT_X_POSITION},${DEFAULT_Y_POSITION}`,
            `--window-size=${DEFAULT_WIDTH},${DEFAULT_HEIGHT}`
        ],
        ...(chromeOptions.headless ? [
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
        chromeFlags
    })

    log.info(`Connect Puppeteer with browser on port ${chrome.port}`)
    const browser = await puppeteer.connect({
        browserURL: `http://localhost:${chrome.port}`,
        defaultViewport: null
    })

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

function launchFirefox (capabilities) {
    const puppeteerFirefox = require('puppeteer-firefox')
    const firefoxOptions = capabilities['moz:firefoxOptions'] || {}
    return puppeteerFirefox.launch({
        args: firefoxOptions.args || [],
        headless: Boolean(firefoxOptions.headless),
        defaultViewport: {
            width: firefoxOptions.width || DEFAULT_WIDTH,
            height: firefoxOptions.height || DEFAULT_HEIGHT
        }
    })
}

/* istanbul ignore next */
function launchEdge () {
    throw new Error('not yet implemented')
}

export default function launch (capabilities) {
    const browserName = capabilities.browserName.toLowerCase()

    if (CHROME_NAMES.includes(browserName)) {
        return launchChrome(capabilities)
    }

    if (FIREFOX_NAMES.includes(browserName)) {
        return launchFirefox(capabilities)
    }

    /* istanbul ignore next */
    if (EDGE_NAMES.includes(browserName)) {
        return launchEdge(capabilities)
    }

    throw new Error(`Couldn't identify browserName ${browserName}`)
}
