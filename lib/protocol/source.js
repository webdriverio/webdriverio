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

module.exports = function source () {

    return this.requestHandler.create(
        '/session/:sessionId/source'
    );

};
