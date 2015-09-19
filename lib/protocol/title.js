/**
 *
 * Get the current page title.
 *
 * @returns {String} The current page title.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/title
 * @type protocol
 *
 */

let title = function () {
    return this.requestHandler.create('/session/:sessionId/title')
}

export default title
