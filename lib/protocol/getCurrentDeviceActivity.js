/**
 *
 * get current device activity (Android only)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#current-activity
 * @type appium
 *
 */

module.exports = function getCurrentDeviceActivity() {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/current_activity',
        method: 'GET'
    };

    return this.requestHandler.create(requestOptions);

};