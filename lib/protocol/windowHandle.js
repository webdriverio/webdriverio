/**
 * Retrieve the current window handle.
 *
 * @returns {String} the current window handle
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handle
 * @type protocol
 *
 */

let windowHandle = function () {
    return this.requestHandler.create('/session/:sessionId/window_handle')
}

export default windowHandle
