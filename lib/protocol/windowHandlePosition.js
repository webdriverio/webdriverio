/**
 *
 * Protocol bindings to receive or change the position of the browser window.
 * If the `windowHandle` URL parameter is falsy, the currently active window will be considered.
 * (Not part of the official Webdriver specification).
 *
 * <example>
    :windowHandlePosition.js
    it('should get or set window position', function () {
        // change the position of a specified window
        client.windowHandlePosition('{dc30381e-e2f3-9444-8bf3-12cc44e8372a}', {x: 100, y: 200});
        // or set the current window position
        browser.windowHandlePosition({x: 100, y: 200});

        // get the position of a specified window
        var position = browser.windowHandlePosition('{dc30381e-e2f3-9444-8bf3-12cc44e8372a}');
        // or of the current window
        position = browser.windowHandlePosition();

        console.log(position); // outputs: {x: 100, y: 200}
    });
 * </example>
 *
 * @param {String=} windowHandle the window to receive/change the position
 * @param {Object=} position     the X and Y coordinates to position the window at, relative to the upper left corner of the screen
 *
 * @return {Object} the X and Y coordinates for the window, relative to the upper left corner of the screen (`{x: number, y: number}`)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidwindowwindowhandleposition
 * @type protocol
 *
 */

let windowHandlePosition = function (windowHandle, position) {
    let data = {}
    let requestOptions = {
        method: 'POST'
    }

    if (typeof windowHandle !== 'string') {
        position = windowHandle
        windowHandle = 'current'
    }

    requestOptions.path = `/session/:sessionId/window/${windowHandle}/position`

    /**
     * check if arguments provide proper position parameter
     */
    if (typeof position === 'object' && typeof position.x === 'number' && typeof position.y === 'number') {
        data = position

    /**
     * otherwise fall back to get operation
     */
    } else {
        requestOptions.method = 'GET'
    }

    return this.requestHandler.create(requestOptions, data).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (err.message.match(/did not match a known command/)) {
            requestOptions.path = '/session/:sessionId/window/rect'
            return this.requestHandler.create(requestOptions, data)
        }

        throw err
    })
}

export default windowHandlePosition
