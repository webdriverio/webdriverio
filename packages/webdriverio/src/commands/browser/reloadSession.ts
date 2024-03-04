import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

const log = logger('webdriverio')

/**
 *
 * Creates a new Selenium session with your current capabilities. This is useful if you
 * test highly stateful application where you need to clean the browser session between
 * the tests in your spec file to avoid creating hundreds of single test files with WDIO.
 * Be careful though, this command affects your test time tremendously since spawning
 * new Selenium sessions is very time consuming especially when using cloud services.
 *
 * <example>
    :reloadSync.js
    it('should reload my session with current capabilities', async () => {
        console.log(browser.sessionId) // outputs: e042b3f3cd5a479da4e171825e96e655
        await browser.reloadSession()
        console.log(browser.sessionId) // outputs: 9a0d9bf9d4864160aa982c50cf18a573
    })

    it('should reload my session with new capabilities', async () => {
        console.log(browser.capabilities.browserName) // outputs: chrome
        await browser.reloadSession({
            browserName: 'firefox'
        })
        console.log(browser.capabilities.browserName) // outputs: firefox
    })
 * </example>
 *
 * @alias browser.reloadSession
 * @param newCapabilities new capabilities to create a session with
 * @type utility
 *
 */
export async function reloadSession (this: WebdriverIO.Browser, newCapabilities?: WebdriverIO.Capabilities) {
    const oldSessionId = (this as WebdriverIO.Browser).sessionId

    /**
     * if a new browser name is given we can shut down the driver since we start a new one
     */
    const shutdownDriver = Boolean(newCapabilities?.browserName)

    /**
     * end current running session, if session already gone suppress exceptions
     */
    try {
        await this.deleteSession({ shutdownDriver })
    } catch (err: any) {
        /**
         * ignoring all exceptions that could be caused by browser.deleteSession()
         * there maybe times where session is ended remotely, browser.deleteSession() will fail in this case)
         * this can be worked around in code but requires a lot of overhead
         */
        log.warn(`Suppressing error closing the session: ${err.stack}`)
    }

    if (this.puppeteer?.isConnected()) {
        this.puppeteer.disconnect()
        log.debug('Disconnected puppeteer session')
    }

    const ProtocolDriver = (await import(this.options.automationProtocol!)).default
    await ProtocolDriver.reloadSession(this, newCapabilities)

    const options = this.options as Options.Testrunner<WebdriverIO.Capabilities | WebdriverIO.MultiRemoteCapabilities>
    if (Array.isArray(options.onReload) && options.onReload.length) {
        await Promise.all(options.onReload.map((hook) => hook(oldSessionId, (this as WebdriverIO.Browser).sessionId)))
    }

    return this.sessionId as string
}
