import fs from 'node:fs'
import WebDriver from 'webdriver'

import { config as smokeConfig } from '../../helpers/config.js'
import { config as watchConfig } from './wdio.conf.js'

const observedBrowsers = new WeakSet()

function observeDeletions(browser) {
    if (browser.isMultiRemote || observedBrowsers.has(browser)) {
        return
    }
    observedBrowsers.add(browser)
    browser.on('result', ({ command, result }) => {
        if (command === 'deleteSession' && !result.error) {
            fs.appendFileSync(process.env.WDIO_WATCH_DELETIONS, JSON.stringify({
                cid: process.env.WDIO_WORKER_ID,
                sessionId: browser.sessionId
            }) + '\n')
        }
    })
}

class SessionObserver {
    constructor() {
        if (!process.env.WDIO_WORKER_ID) {
            return
        }

        // Shutdown attaches in a fresh worker without running the before hook.
        // Observe the client there so successful mock responses are still recorded.
        const attachToSession = WebDriver.attachToSession
        WebDriver.attachToSession = function (...args) {
            const browser = attachToSession.apply(this, args)
            observeDeletions(browser)
            return browser
        }
    }

    before(capabilities, specs, browser) {
        browser.instances.forEach((name) => observeDeletions(browser.getInstance(name)))
    }
}

export const config = {
    ...smokeConfig,
    ...watchConfig,
    hostname: 'localhost',
    port: 4444,
    outputDir: undefined,
    services: [...smokeConfig.services, ...watchConfig.services, [SessionObserver]]
}
