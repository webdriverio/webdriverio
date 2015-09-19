/**
 *
 * Get the current page source.
 *
 * @returns {String} The current page source.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/source
 * @type protocol
 *
 */

let source = function () {
    return this.requestHandler.create('/session/:sessionId/source')
}

export default source
