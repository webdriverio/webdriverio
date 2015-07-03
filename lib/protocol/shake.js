/**
 *
 * Simulate the device shaking.
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#shake
 * @type appium
 *
 */

module.exports = function shake() {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/shake',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};