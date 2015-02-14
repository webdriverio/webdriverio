/**
 *
 * Get the current page title.
 *
 * @returns {String} The current page title.
 * @callbackParameter error, response
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/title
 * @type protocol
 *
 */

module.exports = function title () {

    this.requestHandler.create(
        '/session/:sessionId/title',
        arguments[arguments.length - 1]
    );

};