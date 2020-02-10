import { launch as launchChromeBrowser } from 'chrome-launcher'
import puppeteer from 'puppeteer-core'
import logger from '@wdio/logger'

import edgeFinder from './finder/edge'
import firefoxFinder from './finder/firefox'
import { getPages } from './utils'
import {
    CHROME_NAMES, FIREFOX_NAMES, EDGE_NAMES, DEFAULT_FLAGS, DEFAULT_WIDTH,
    DEFAULT_HEIGHT, DEFAULT_X_POSITION, DEFAULT_Y_POSITION
} from './constants'

const log = logger('devtools')

/**
 * launches Chrome and returns a Puppeteer browser instance
 * @param  {object} capabilities  session capabilities
 * @return {object}               puppeteer browser instance
 */
async function launchChrome (capabilities) {
    const chromeOptions = capabilities['goog:chromeOptions'] || {}
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

    log.info(`Launch Chrome with flags: ${chromeFlags.join(' ')}`)
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

    return browser
}

function launchBrowser (capabilities, executablePath, vendorCapKey, config = {}) {
    const edgeOptions = capabilities[vendorCapKey] || {}
    return puppeteer.launch({
        ...config,
        executablePath,
        args: edgeOptions.args || [],
        headless: Boolean(edgeOptions.headless),
        defaultViewport: {
            width: edgeOptions.width || DEFAULT_WIDTH,
            height: edgeOptions.height || DEFAULT_HEIGHT
        }
    })
}

function launchFirefox (capabilities) {
    const executablePath = firefoxFinder[process.platform]()[0]
    return launchBrowser(capabilities, executablePath, 'moz:firefoxOptions', { product: 'firefox' })
}

function launchEdge (capabilities) {
    const executablePath = edgeFinder[process.platform]()[0]
    return launchBrowser(capabilities, executablePath, 'ms:edgeOptions')
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
