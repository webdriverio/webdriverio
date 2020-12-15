import logger from '@wdio/logger'
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
    it('should reload my session with current capabilities', () => {
        console.log(browser.sessionId) // outputs: e042b3f3cd5a479da4e171825e96e655
        browser.reloadSession()
        console.log(browser.sessionId) // outputs: 9a0d9bf9d4864160aa982c50cf18a573
    })
 * </example>
 *
 * @alias browser.reloadSession
 * @type utility
 *
 */
export default async function reloadSession (this: WebdriverIO.BrowserObject) {
    const oldSessionId = this.sessionId

    /**
     * end current running session, if session already gone suppress exceptions
     */
    try {
        await this.deleteSession()
    } catch (err) {
        /**
         * ignoring all exceptions that could be caused by browser.deleteSession()
         * there maybe times where session is ended remotely, browser.deleteSession() will fail in this case)
         * this can be worked around in code but requires a lot of overhead
         */
        log.warn(`Suppressing error closing the session: ${err.stack}`)
    }

    const ProtocolDriver = require(this.config.automationProtocol!).default
    await ProtocolDriver.reloadSession(this)

    if (Array.isArray(this.config.onReload) && this.config.onReload.length) {
        await Promise.all(this.config.onReload.map((hook) => hook(oldSessionId, this.sessionId)))
    }

    return this.sessionId
}
