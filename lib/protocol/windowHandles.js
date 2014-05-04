/**
 *
 * Retrieve the list of all window handles available to the session.
 *
 * @returns {String[]} A list of window handles.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handles
 *
 */

module.exports = function windowHandles () {

    this.requestHandler.create(
        '/session/:sessionId/window_handles',
        arguments[arguments.length - 1]
    );

};