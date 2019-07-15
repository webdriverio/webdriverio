import { launch as launchChromeBrowser } from 'chrome-launcher'
import puppeteer from 'puppeteer-core'
import puppeteerFirefox from 'puppeteer-firefox'
import logger from '@wdio/logger'

import {
    CHROME_NAMES, FIREFOX_NAMES, EDGE_NAMES, DEFAULT_FLAGS, DEFAULT_WIDTH,
    DEFAULT_HEIGHT
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

    return browser
}

function launchFirefox () {
    return puppeteerFirefox.launch({
        headless: false,
        defaultViewport: {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT
        }
    })
}

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

    if (EDGE_NAMES.includes(browserName)) {
        return launchEdge(capabilities)
    }

    throw new Error(`Couldn't identify browserName ${browserName}`)
}
