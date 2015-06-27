/**
 *
 * send the currently active app to the background.
 *
 * @param {Number} seconds  number of seconds after the app gets send to background
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#background-app
 * @type appium
 *
 */

module.exports = function backgroundApp(seconds) {

    var requestOptions = {
        path: '/session/:sessionId/appium/app/background',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, {seconds: seconds});

};