/**
 * Configure the amount of time that a particular type of operation can execute
 * for before they are aborted and a Timeout error is returned to the client.
 *
 * If no parameters are given it returns the current timeout settings (only supported
 * by drivers which have the W3C Webdriver protocol implemented)
 *
 * <example>
    :timeouts.js
    it('timeouts example', function() {
        // set timeouts: not W3C WebDriver compatible call (old drivers)
        browser.timeouts('script', 3000);

        // set timeouts: W3C WebDriver compatible call (new drivers)
        browser.timeouts({
            "script": 1000,
            "pageLoad": 7000,
            "implicit": 5000
        });

        // get timeouts
        const timeouts = browser.timeouts();
    });
 * </example>
 *
 * @param {String=} type The type of operation to set the timeout for. Valid values are:<br>- **script** Determines when to interrupt a script that is being [evaluated](https://www.w3.org/TR/webdriver/#executing-script).<br>- **implicit** Gives the timeout of when to abort [locating an element](https://www.w3.org/TR/webdriver/#element-retrieval).<br>- **pageLoad** Provides the timeout limit used to interrupt [navigation](https://html.spec.whatwg.org/#navigate) of the [browsing context](https://html.spec.whatwg.org/#browsing-context). <br />The `pageLoad` keyword is a part of the official WebDriver [specification](https://www.w3.org/TR/webdriver/#set-timeouts), but might not be [supported](https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/687) for your browser (the previous name is `page load`).
 * @param {Number=} ms The amount of time, in milliseconds, that time-limited commands are permitted to run.
 *
 * @see https://www.w3.org/TR/webdriver/#get-timeouts
 * @type protocol
 *
 */

export default function timeouts (type, ms) {
    /**
     * set timeouts (W3C Webdriver protocol only)
     */
    if (typeof type === 'object') {
        return this.requestHandler.create('/session/:sessionId/timeouts', type)
    }

    /**
     * get timeouts (W3C Webdriver protocol only)
     */
    if (typeof type !== 'string' || typeof ms !== 'number') {
        return this.requestHandler.create('/session/:sessionId/timeouts')
    }

    return this.requestHandler.create('/session/:sessionId/timeouts', {
        type: type,
        ms: ms
    })
}
