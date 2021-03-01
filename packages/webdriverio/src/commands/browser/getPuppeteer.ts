import puppeteer from 'puppeteer-core'
import { Capabilities } from '@wdio/types'
import { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'

import { FF_REMOTE_DEBUG_ARG } from '../../constants'

/**
 * Get the [Puppeteer Browser instance](https://pptr.dev/#?product=Puppeteer&version=v5.1.0&show=api-class-browser)
 * to run commands with Puppeteer. Note that all Puppeteer commands are
 * asynchronous by default so in order to interchange between sync and async
 * execution make sure to wrap your Puppeteer calls within a `browser.call`
 * commands as shown in the example.
 *
 * :::info
 *
 * Note that using Puppeteer requires support for Chrome DevTools protocol and e.g.
 * can not be used when running automated tests in the cloud. Find out more in the
 * [Automation Protocols](/docs/automationProtocols) section.
 *
 * :::
 *
 * <example>
    :getPuppeteer.test.js
    it('should allow me to use Puppeteer', () => {
        // WebDriver command
        browser.url('https://webdriver.io')

        const puppeteerBrowser = browser.getPuppeteer()
        // switch to Puppeteer
        const metrics = browser.call(async () => {
            await pages = await puppeteerBrowser.pages()
            pages[0].setGeolocation({ latitude: 59.95, longitude: 30.31667 })
            return pages[0].metrics()
        })

        console.log(metrics.LayoutCount) // returns 42
    })
 * </example>
 *
 * @return {PuppeteerBrowser}  initiated puppeteer instance connected to the browser
 */
export default async function getPuppeteer (this: WebdriverIO.Browser) {
    /**
     * check if we already connected Puppeteer and if so return
     * that instance
     */
    if (this.puppeteer) {
        return this.puppeteer
    }

    /**
     * attach to Chromium debugger session
     */
    const caps = (this.capabilities as Capabilities.W3CCapabilities).alwaysMatch || this.capabilities as Capabilities.DesiredCapabilities
    const chromiumOptions = caps['goog:chromeOptions'] || caps['ms:edgeOptions']
    if (chromiumOptions && chromiumOptions.debuggerAddress) {
        this.puppeteer = await puppeteer.connect({
            browserURL: `http://${chromiumOptions.debuggerAddress}`,
            // @ts-ignore ToDo(@L0tso): remove once https://github.com/puppeteer/puppeteer/pull/6942 is merged
            defaultViewport: null
        }) as any as PuppeteerBrowser
        return this.puppeteer
    }

    /**
     * attach to Firefox debugger session
     */
    if (caps.browserName?.toLowerCase() === 'firefox') {
        if (!caps.browserVersion) {
            throw new Error('Can\'t find "browserVersion" in capabilities')
        }

        const majorVersion = parseInt(caps.browserVersion.split('.').shift() || '', 10)
        if (majorVersion >= 79) {
            const reqCaps = (this.requestedCapabilities as Capabilities.W3CCapabilities).alwaysMatch || this.requestedCapabilities as Capabilities.DesiredCapabilities
            const ffOptions = caps['moz:firefoxOptions']
            const ffArgs = reqCaps['moz:firefoxOptions']?.args

            const rdPort = ffOptions && ffOptions.debuggerAddress
                ? ffOptions.debuggerAddress
                : ffArgs?.[ffArgs.findIndex((arg: string) => arg === FF_REMOTE_DEBUG_ARG) + 1] ?? null

            if (!rdPort) {
                throw new Error('Could\'t find remote debug port in Firefox options')
            }

            this.puppeteer = await puppeteer.connect({
                browserURL: `http://localhost:${rdPort}`,
                // @ts-ignore ToDo(@L0tso): remove once https://github.com/puppeteer/puppeteer/pull/6942 is merged
                defaultViewport: null
            }) as any as PuppeteerBrowser
            return this.puppeteer as any as PuppeteerBrowser
        }
    }

    throw new Error(
        'Using DevTools capabilities is not supported for this session. ' +
        'This feature is only supported for local testing on Chrome, Firefox and Chromium Edge.'
    )
}
