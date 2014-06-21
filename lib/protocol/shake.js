/**
 *
 * Simulate the device shaking.
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#shake
 * @type appium
 *
 */

module.exports = function shake() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/shake',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};