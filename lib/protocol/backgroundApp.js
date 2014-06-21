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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/background',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, {seconds: seconds}, callback);

};