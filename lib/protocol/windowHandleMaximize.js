/**
 *
 * Maximize the specified window if not already maximized. If the :windowHandle URL parameter is "current",
 * the currently active window will be maximized.
 *
 * @param {String=} windowHandle window to maximize (if parameter is falsy the currently active window will be maximized)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window/:windowHandle/maximize
 * @type protocol
 *
 */

let windowHandleMaximize = function (windowHandle = 'current') {
    return this.requestHandler.create({
        path: `/session/:sessionId/window/${windowHandle}/maximize`,
        method: 'POST'
    })
}

export default windowHandleMaximize
