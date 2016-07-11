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

        if (!Array.isArray(this.options.onReload)) {
            return Promise.resolve()
        }

        return Promise.all(this.options.onReload.map(
            (hook) => hook(oldSessionId, newSessionId)
        ))
    }).catch((e) => {
        console.log(`Error in onReload hook: "${e.stack}"`)
    })
}

export default reload
