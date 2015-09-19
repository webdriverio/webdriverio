/**
 *
 * Refresh the current page.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/refresh
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
