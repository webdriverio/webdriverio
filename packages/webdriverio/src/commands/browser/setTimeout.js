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
 * @param {Object} timeouts  Object containing session timeout values
 * @param {Number} timeouts.implicit  (Optional) Time in milliseconds to retry the element location strategy when finding an element.
 * @param {Number} timeouts.pageLoad  (Optional) Time in milliseconds to wait for the document to finish loading.
 * @param {Number} timeouts.script  (Optional) Scripts injected with [`execute`](https://webdriver.io/docs/api/browser/execute.html) or [`executeAsync`](https://webdriver.io/docs/api/browser/executeAsync.html) will run until they hit the script timeout duration, which is also given in milliseconds.
 * @see https://w3c.github.io/webdriver/#set-timeouts
 *
 */

export default async function setTimeout(timeouts) {
    if (!(timeouts instanceof Object)) {
        return Promise.reject(new Error('Parameter for "setTimeout" command needs to be an object'))
    }
    // If value is not an integer, or it is less than 0 or greater than the maximum safe integer, return error with error code invalid argument.
    const timeoutValues = Object.values(timeouts)
    if (timeoutValues.length && timeoutValues.every(timeout => typeof timeout !== 'number' || timeout < 0 || timeout > Number.MAX_SAFE_INTEGER)) {
        return Promise.reject(new Error('Specified timeout values are not valid integer (see https://webdriver.io/docs/api/browser/setTimeout.html for documentation).'))
    }

    let implicit
    let pageLoad
    let script

    if (typeof timeouts.implicit !== 'undefined') {
        implicit = timeouts.implicit
    }
    // Previously also known as `page load` with JsonWireProtocol
    if (!this.isW3C && typeof timeouts['page load'] !== 'undefined') {
        pageLoad = timeouts['page load']
    }
    if (typeof timeouts.pageLoad !== 'undefined') {
        pageLoad = timeouts.pageLoad
    }
    if (typeof timeouts.script !== 'undefined') {
        script = timeouts.script
    }

    /**
     * JsonWireProtocol action
     */
    if (!this.isW3C) {
        let setTimeoutsResponse
        if (typeof implicit === 'number') {
            setTimeoutsResponse = await this.setTimeouts('implicit', implicit)
        }
        if (typeof pageLoad === 'number') {
            setTimeoutsResponse = await this.setTimeouts('page load', pageLoad)
        }
        if (typeof script === 'number') {
            setTimeoutsResponse = await this.setTimeouts('script', script)
        }
        return Promise.resolve(setTimeoutsResponse)
    }

    return this.setTimeouts(implicit, pageLoad, script)
}
