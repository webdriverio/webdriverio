/**
 * Retrieve the current window handle.
 *
 * @returns {String} the current window handle
 * @callbackParameter error, response
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handle
 * @type protocol
 *
 */

module.exports = function windowHandle () {

    return this.requestHandler.create(
        '/session/:sessionId/window_handle'
    );

};