/**
 *
 * Creates a new Selenium session with your current capabilities. This is useful if you
 * test highly stateful application where you need to clean the browser session between
 * the tests in your spec file to avoid creating hundrets of single test files with WDIO.
 * Be careful though. This command affects your test time tremendously since spawning
 * new Selenium session is very time consuming especially when using cloud services.
 *
 * <example>
    :reloadSync.js
    it('should reload my session', function () {
        console.log(browser.sessionId); // outputs: e042b3f3cd5a479da4e171825e96e655
        browser.reload();
        console.log(browser.sessionId); // outputs: 9a0d9bf9d4864160aa982c50cf18a573
    })
 * </example>
 *
 * @alias browser.reload
 * @type utility
 *
 */

let reload = function () {
    const oldSessionId = this.requestHandler.sessionID

    return this.end().init().then((res) => {
        const newSessionId = this.requestHandler.sessionID

        if (!Array.isArray(this.options.onRefresh)) {
            return Promise.resolve()
        }

        return Promise.all(this.options.onRefresh.map(
            (hook) => hook(oldSessionId, newSessionId)
        ))
    }).catch((e) => {
        console.log(`Error in onRefresh hook: "${e.stack}"`)
    })
}

export default reload
