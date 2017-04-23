/**
 * Navigate forwards in the browser history, if possible.
 *
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#forward
 * @type protocol
 *
 */

export default function forward () {
    /*!
     * helper for safaridriver which doesn not support forward
     * Reason: "Yikes! Safari history navigation does not work. We can go forward or back,
     * but once we do, we can no longer communicate with the page"
     */
    if (this.desiredCapabilities.browserName === 'safari') {
        return this.execute('history.go(+1)').waitForExist('body', 5000)
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/forward',
        method: 'POST'
    })
}
