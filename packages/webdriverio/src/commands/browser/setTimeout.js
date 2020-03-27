/**
 *
 * Sets the timeouts associated with the current session, timeout durations control such
 * behaviour as timeouts on script injection, document navigation, and element retrieval.
 * For more information and examples, see [timeouts guide](https://webdriver.io/docs/timeouts.html#selenium-timeouts).
 *
 * <example>
    :setTimeout.js
    it('should change timeout duration for session with long code duration', () => {
        browser.setTimeout({
            'pageLoad': 10000,
            'script': 60000
        });
        // Execute code which takes a long time
        browser.executeAsync((done) => {
            console.log('Wake me up before you go!');
            setTimeout(done, 59000);
        });
    });
 * </example>
 *
 * @param {Timeouts}  timeouts            Object containing session timeout values
 * @param {Number=}   timeouts.implicit  Time in milliseconds to retry the element location strategy when finding an element.
 * @param {Number=}   timeouts.pageLoad  Time in milliseconds to wait for the document to finish loading.
 * @param {Number=}   timeouts.script    Scripts injected with [`execute`](https://webdriver.io/docs/api/browser/execute.html) or [`executeAsync`](https://webdriver.io/docs/api/browser/executeAsync.html) will run until they hit the script timeout duration, which is also given in milliseconds.
 * @see https://w3c.github.io/webdriver/#set-timeouts
 *
 */

export default async function setTimeout(timeouts) {
    if (typeof timeouts !== 'object') {
        throw new Error('Parameter for "setTimeout" command needs to be an object')
    }

    /**
     * If value is not an integer, or it is less than 0 or greater than the maximum safe
     * integer, return error with error code invalid argument.
     */
    const timeoutValues = Object.values(timeouts)
    if (timeoutValues.length && timeoutValues.every(timeout => typeof timeout !== 'number' || timeout < 0 || timeout > Number.MAX_SAFE_INTEGER)) {
        throw new Error('Specified timeout values are not valid integer (see https://webdriver.io/docs/api/browser/setTimeout.html for documentation).')
    }

    const implicit = timeouts.implicit
    // Previously also known as `page load` with JsonWireProtocol
    const pageLoad = timeouts['page load'] || timeouts.pageLoad
    const script = timeouts.script

    /**
     * JsonWireProtocol action
     */
    if (!this.isW3C) {
        return Promise.all([
            isFinite(implicit) && this.setTimeouts('implicit', implicit),
            isFinite(pageLoad) && this.setTimeouts('page load', pageLoad),
            isFinite(script) && this.setTimeouts('script', script),
        ].filter(Boolean))
    }

    return this.setTimeouts(implicit, pageLoad, script)
}
