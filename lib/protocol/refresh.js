/**
 *
 * Refresh the current page.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-refresh
 * @type protocol
 *
 */

let refresh = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/refresh',
        method: 'POST'
    })
}

export default refresh
