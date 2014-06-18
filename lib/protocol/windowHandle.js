/**
 * Retrieve the current window handle.
 *
 * @returns {String} the current window handle
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handle
 * @type protocol
 *
 */

module.exports = function windowHandle () {

    this.requestHandler.create(
        '/session/:sessionId/window_handle',
        arguments[arguments.length - 1]
    );

};