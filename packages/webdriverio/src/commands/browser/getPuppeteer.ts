import puppeteer from 'puppeteer-core'
import logger from '@wdio/logger'
import { Capabilities } from '@wdio/types'
import { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'

import { FF_REMOTE_DEBUG_ARG } from '../../constants'

const log = logger('webdriverio')

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
            const pages = await puppeteerBrowser.pages()
            pages[0].setGeolocation({ latitude: 59.95, longitude: 30.31667 })
            return pages[0].metrics()
        })

        console.log(metrics.LayoutCount) // returns LayoutCount value
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
    if (this.puppeteer?.isConnected()) {
        log.debug('Reusing existing puppeteer session')
        return this.puppeteer
    }

    const caps = (this.capabilities as Capabilities.W3CCapabilities).alwaysMatch || this.capabilities as Capabilities.DesiredCapabilities
    /**
     * attach to a Selenium 4 CDP Session if it's returned in the capabilities
     */
    const cdpEndpoint = caps['se:cdp']
    if (cdpEndpoint) {
        this.puppeteer = await puppeteer.connect({
            browserWSEndpoint: cdpEndpoint,
            defaultViewport: null
        }) as any as PuppeteerBrowser
        return this.puppeteer
    }
    /**
     * attach to a Selenoid\Moon CDP Session if there are Aerokube vendor capabilities
     */
    const requestedCapabilities = (this.requestedCapabilities as Capabilities.W3CCapabilities)?.alwaysMatch || this.requestedCapabilities as Capabilities.DesiredCapabilities
    const isAerokubeSession = requestedCapabilities['selenoid:options'] || requestedCapabilities['moon:options']
    if (isAerokubeSession) {
        const { hostname, port } = this.options
        this.puppeteer = await puppeteer.connect({
            browserWSEndpoint: `ws://${hostname}:${port}/devtools/${this.sessionId}`,
            defaultViewport: null
        }) as any as PuppeteerBrowser
        return this.puppeteer
    }
    /**
     * attach to Chromium debugger session
     */
    const chromiumOptions = caps['goog:chromeOptions'] || caps['ms:edgeOptions']
    if (chromiumOptions && chromiumOptions.debuggerAddress) {
        this.puppeteer = await puppeteer.connect({
            browserURL: `http://${chromiumOptions.debuggerAddress}`,
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
