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

module.exports = function title () {

    return this.requestHandler.create(
        '/session/:sessionId/title'
    );

};