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

import WebDriverRequest from 'webdriver/build/request'

export default async function reloadSession () {
    const oldSessionId = this.sessionId

    /**
     * end current running session
     */
    await this.deleteSession()

    const { w3cCaps, jsonwpCaps } = this.options.requestedCapabilities
    const sessionRequest = new WebDriverRequest(
        'POST',
        '/session',
        {
            capabilities: w3cCaps, // W3C compliant
            desiredCapabilities: jsonwpCaps // JSONWP compliant
        }
    )

    const response = await sessionRequest.makeRequest(this.options)
    const newSessionId = response.sessionId || (response.value && response.value.sessionId)
    this.sessionId = newSessionId

    if (Array.isArray(this.options.onReload) && this.options.onReload.length) {
        await Promise.all(this.options.onReload.map((hook) => hook(oldSessionId, newSessionId)))
    }

    return newSessionId
}
