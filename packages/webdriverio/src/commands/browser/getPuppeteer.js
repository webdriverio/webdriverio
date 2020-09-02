/**
 * Get the [Puppeteer Browser instance](https://pptr.dev/#?product=Puppeteer&version=v5.1.0&show=api-class-browser)
 * to run commands with Puppeteer. Note that all Puppeteer commands are
 * asynchronous by default so in order to interchange between sync and async
 * execution make sure to wrap your Puppeteer calls within a `browser.call`
 * commands as shown in the example.
 *
 * @return {PuppeteerBrowser}  initiated puppeteer instance connected to the browser
 */
import puppeteer from 'puppeteer-core'
import { FF_REMOTE_DEBUG_ARG } from '../../constants'

export default async function getPuppeteer () {
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
    const chromiumOptions = this.capabilities['goog:chromeOptions'] || this.capabilities['ms:edgeOptions']
    if (chromiumOptions && chromiumOptions.debuggerAddress) {
        this.puppeteer = await puppeteer.connect({
            browserURL: `http://${chromiumOptions.debuggerAddress}`,
            defaultViewport: null
        })
        return this.puppeteer
    }

    /**
     * attach to Firefox debugger session
     */
    if (this.capabilities.browserName.toLowerCase() === 'firefox') {
        const majorVersion = parseInt(this.capabilities.browserVersion.split('.').shift(), 10)
        if (majorVersion >= 79) {
            const ffOptions = this.capabilities['moz:firefoxOptions']
            const ffArgs = this.requestedCapabilities['moz:firefoxOptions'].args

            const rdPort = ffOptions && ffOptions.debuggerAddress
                ? ffOptions.debuggerAddress
                : ffArgs[ffArgs.findIndex((arg) => arg === FF_REMOTE_DEBUG_ARG) + 1]
            this.puppeteer = await puppeteer.connect({
                browserURL: `http://localhost:${rdPort}`,
                defaultViewport: null
            })
            return this.puppeteer
        }
    }

    throw new Error(
        'Using DevTools capabilities is not supported for this session. ' +
        'This feature is only supported for local testing on Chrome, Firefox and Chromium Edge.'
    )
}
