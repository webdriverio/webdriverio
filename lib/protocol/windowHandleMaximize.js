/**
 *
 * Maximize the specified window if not already maximized. If the :windowHandle URL parameter is "current",
 * the currently active window will be maximized.
 *
 * @param {String=} windowHandle window to maximize (if parameter is falsy the currently active window will be maximized)
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-maximize-window
 * @type protocol
 *
 */

let windowHandleMaximize = function (windowHandle = 'current') {
    const requestOptions = {
        path: `/session/:sessionId/window/${windowHandle}/maximize`,
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions).catch(() => {
        /**
         * use W3C path if old path failed
         */
        requestOptions.path = '/session/:sessionId/window/maximize'
        return this.requestHandler.create(requestOptions)
    })
}

export default windowHandleMaximize
