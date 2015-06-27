/**
 *
 * Retrieve the list of all window handles available to the session.
 *
 * @returns {String[]} a list of window handles
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handles
 * @type protocol
 *
 */

module.exports = function windowHandles () {

    return this.requestHandler.create(
        '/session/:sessionId/window_handles'
    );

};