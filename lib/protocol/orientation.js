/**
 *
 * Protocol bindings for all mobile orientation operations. (Not part of the official Webdriver specification).
 *
 * <example>
    :orientation.js
    it('should set/get orientation using protocol command', function () {
        // set the browser orientation. The orientation should be
        // specified as defined in ScreenOrientation: {LANDSCAPE|PORTRAIT}
        browser.orientation('landscape');

        // get the current browser orientation. The server should
        // return a valid orientation value as defined in
        // screen orientation: {LANDSCAPE|PORTRAIT}
        var orientation = browser.orientation();
        console.log(orientation.value); // outputs: "landscape"
    });
 * </example>
 *
 * @param   {String=} deviceOrientation  The new browser orientation as defined in ScreenOrientation: `{LANDSCAPE|PORTRAIT}`
 * @return {String}                     device orientation (`LANDSCAPE/PORTRAIT`)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidorientation
 * @type mobile
 * @for android, ios
 *
 */

export default function orientation (deviceOrientation) {
    let data = {}

    if (typeof deviceOrientation === 'string') {
        data.orientation = deviceOrientation.toUpperCase()
    }

    return this.requestHandler.create('/session/:sessionId/orientation', data)
}
