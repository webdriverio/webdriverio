/**
 *
 * Maximize the specified window if not already maximized. If the :windowHandle URL parameter is 'current',
 * the currently active window will be maximized.
 *
 * @param {String=} windowHandle window to maximize (if parameter is falsy the currently active window will be maximized)
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-maximize-window
 * @type protocol
 *
 */

let windowHandleMaximize = function (windowHandle = 'current') {
    var path = `/session/:sessionId/window/${windowHandle}/maximize`

    if (this.options.useW3C && this.desiredCapabilities.browserName === 'firefox') {
        path = '/session/:sessionId/window/maximize'
    }

    return this.requestHandler.create({
        path: path,
        method: 'POST'
    }, {dummy: 'dummy'})
}

export default windowHandleMaximize
