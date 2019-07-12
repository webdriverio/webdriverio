import uuidv4 from 'uuid/v4'

import DevToolsDriver from './devtoolsdriver'
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from './constants'

const driver = new DevToolsDriver()
const nonExistingPuppeteer = {
    launch: () => Promise.reject(new Error('browser not supported'))
}

const puppeteerMap = {
    'chrome': require('puppeteer'),
    'firefox': require('puppeteer-firefox')
}

const sessionMap = new Map()

export function commandWrapper (_, __, commandInfo) {
    return driver.register(commandInfo, sessionMap)
}

export async function startBrowserWithDevTools (params) {
    /**
     * the user could have passed in either w3c style or jsonwp style caps
     * and we want to pass both styles to the server, which means we need
     * to check what style the user sent in so we know how to construct the
     * object for the other style
     */
    const [w3cCaps, jsonwpCaps] = params.capabilities && params.capabilities.alwaysMatch
        /**
         * in case W3C compliant capabilities are provided
         */
        ? [params.capabilities, params.capabilities.alwaysMatch]
        /**
         * otherwise assume they passed in jsonwp-style caps (flat object)
         */
        : [{ alwaysMatch: params.capabilities, firstMatch: [{}] }, params.capabilities]

    const puppeteer = puppeteerMap[params.capabilities.browserName] || nonExistingPuppeteer
    const sessionId = uuidv4()
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT
        }
    })

    /**
     * save original set of capabilities to allow to request the same session again
     * (e.g. for reloadSession command in WebdriverIO)
     */
    params.requestedCapabilities = { w3cCaps, jsonwpCaps }

    sessionMap.set(sessionId, browser)
    return { value: {}, sessionId }
}
