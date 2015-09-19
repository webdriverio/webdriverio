/**
 *
 * Protocol bindings for all mobile orientation operations.
 *
 * <example>
    :orientation.js
    // get the current browser orientation. The server should
    // return a valid orientation value as defined in
    // screen orientation: {LANDSCAPE|PORTRAIT}
    client.orientation(function(err,res) { ... });

    // set the browser orientation. The orientation should be
    // specified as defined in ScreenOrientation: {LANDSCAPE|PORTRAIT}
    client.orientation('landscape');
 * </example>
 *
 * @param   {String=} deviceOrientation  The new browser orientation as defined in ScreenOrientation: `{LANDSCAPE|PORTRAIT}`
 * @returns {String}                     device orientation (`{LANDSCAPE|PORTRAIT}`)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/orientation
 * @type protocol
 *
 */

let orientation = function (deviceOrientation) {
    let data = {}

    if (typeof deviceOrientation === 'string') {
        data.orientation = deviceOrientation.toUpperCase()
    }

    return this.requestHandler.create('/session/:sessionId/orientation', data)
}

export default orientation
