import logger from '@wdio/logger'
import { userImport } from '@wdio/utils'
import type { Capabilities } from '@wdio/types'
import type { Puppeteer, Browser as PuppeteerBrowser } from 'puppeteer-core'

import { FF_REMOTE_DEBUG_ARG } from '../../constants.js'

const log = logger('webdriverio')
const DEBUG_PIPE_FLAG = 'remote-debugging-pipe'

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
 * can not be used when running automated tests in the cloud. Chrome DevTools protocol is not installed by default,
 * use `npm install puppeteer-core` to install it.
 * Find out more in the [Automation Protocols](/docs/automationProtocols) section.
 *
 * :::
 *
 * :::info
 *
 * Note: Puppeteer is currently __not__ supported when running [component tests](/docs/component-testing).
 *
 * :::
 *
 * <example>
    :getPuppeteer.test.js
    it('should allow me to use Puppeteer', async () => {
        // WebDriver command
        await browser.url('https://webdriver.io')

        const puppeteerBrowser = await browser.getPuppeteer()
        // switch to Puppeteer
        const metrics = await browser.call(async () => {
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
export async function getPuppeteer (this: WebdriverIO.Browser): Promise<PuppeteerBrowser> {
    /**
     * Tell user that Puppeteer is not supported in browser runner
     */
    if (globalThis.wdio) {
        throw new Error('Puppeteer is not supported in browser runner')
    }

    const puppeteer = await userImport<Puppeteer>('puppeteer-core')

    if (!puppeteer) {
        throw new Error(
            'You need to install "puppeteer-core" package as a dependency ' +
            'in order to use the "getPuppeteer" method'
        )
    }

    /**
     * check if we already connected Puppeteer and if so return
     * that instance
     */
    if (this.puppeteer?.connected) {
        log.debug('Reusing existing puppeteer session')
        return this.puppeteer
    }

    const { headers } = this.options
    /**
     * attach to a Selenium 4 CDP Session if it's returned in the capabilities
     */
    const cdpEndpoint = this.capabilities['se:cdp']
    if (cdpEndpoint) {
        this.puppeteer = await puppeteer.connect({
            browserWSEndpoint: cdpEndpoint,
            defaultViewport: null,
            headers
        }) as unknown as PuppeteerBrowser
        return this.puppeteer
    }
    /**
     * attach to a Selenoid\Moon CDP Session if there are Aerokube vendor capabilities
     */
    const requestedCapabilities = (this.requestedCapabilities as Capabilities.W3CCapabilities)?.alwaysMatch || this.requestedCapabilities
    const isAerokubeSession = requestedCapabilities['selenoid:options'] || requestedCapabilities['moon:options']
    if (isAerokubeSession) {
        const { hostname, port } = this.options
        this.puppeteer = await puppeteer.connect({
            browserWSEndpoint: `ws://${hostname}:${port}/devtools/${this.sessionId}`,
            defaultViewport: null,
            headers
        }) as unknown as PuppeteerBrowser
        return this.puppeteer
    }
    /**
     * attach to Chromium debugger session
     */
    const chromiumOptions = this.capabilities['goog:chromeOptions'] || this.capabilities['ms:edgeOptions']
    if (chromiumOptions && chromiumOptions.debuggerAddress) {
        this.puppeteer = await puppeteer.connect({
            browserURL: `http://${chromiumOptions.debuggerAddress.replace('localhost', '0.0.0.0')}`,
            defaultViewport: null
        }) as unknown as PuppeteerBrowser
        return this.puppeteer
    } else if (
        /**
         * if --remote-debugging-pipe is set as Chrome flag, we can't attach to the session
         * as there won't be a `debuggerAddress` available in the capabilities. Provide this
         * better error message to the user.
         */
        chromiumOptions &&
        (
            chromiumOptions.args?.includes(DEBUG_PIPE_FLAG) ||
            chromiumOptions.args?.includes(`--${DEBUG_PIPE_FLAG}`)
        )
    ) {
        throw new Error(`Cannot attach to Chrome Devtools session if --${DEBUG_PIPE_FLAG} is set as Chrome flag.`)
    }

    /**
     * attach to Firefox debugger session
     */
    if (this.capabilities.browserName?.toLowerCase() === 'firefox') {
        if (!this.capabilities.browserVersion) {
            throw new Error('Can\'t find "browserVersion" in capabilities')
        }

        const majorVersion = parseInt(this.capabilities.browserVersion.split('.').shift() || '', 10)
        if (majorVersion >= 79) {
            const reqCaps = (this.requestedCapabilities as Capabilities.W3CCapabilities).alwaysMatch || this.requestedCapabilities
            let browserURL: string | undefined

            if (this.capabilities['moz:debuggerAddress']) {
                browserURL = this.capabilities['moz:debuggerAddress'] as string
            } else {
                const ffOptions = this.capabilities['moz:firefoxOptions']
                const ffArgs = reqCaps['moz:firefoxOptions']?.args || []
                const rdPort = ffOptions && ffOptions.debuggerAddress
                    ? ffOptions.debuggerAddress
                    : ffArgs[ffArgs.findIndex((arg: string) => arg === FF_REMOTE_DEBUG_ARG) + 1]

                if (rdPort) {
                    browserURL = `http://localhost:${rdPort}`
                }
            }

            if (!browserURL) {
                throw new Error(
                    'Could\'t find a websocket url within returned capabilities to connect to! ' +
                    'Make sure you have "moz:debuggerAddress" set to `true` in your Firefox capabilities'
                )
            }

            this.puppeteer = await puppeteer.connect({
                browserURL,
                defaultViewport: null
            }) as unknown as PuppeteerBrowser
            return this.puppeteer as unknown as PuppeteerBrowser
        }
    }

    throw new Error(
        'Using DevTools capabilities is not supported for this session. ' +
        'This feature is only supported for local testing on Chrome, Firefox and Chromium Edge.'
    )
}
