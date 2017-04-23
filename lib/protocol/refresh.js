/**
 *
 * Refresh the current page.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#refresh
 * @type protocol
 *
 */

export default function refresh () {
    return this.requestHandler.create({
        path: '/session/:sessionId/refresh',
        method: 'POST'
    })
}
