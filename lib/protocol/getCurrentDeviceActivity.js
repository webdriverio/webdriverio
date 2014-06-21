/**
 *
 * get current device activity (Android only)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#current-activity
 * @type appium
 *
 */

module.exports = function getCurrentDeviceActivity() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/current_activity',
        method: 'GET'
    };

    this.requestHandler.create(requestOptions, callback);

};