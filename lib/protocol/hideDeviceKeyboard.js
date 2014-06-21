/**
 *
 * Hide the keyboard (iOS only)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#hide-keyboard-ios-only
 * @type appium
 *
 */

module.exports = function hideDeviceKeyboard(keyName) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/hide_keyboard',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, { keyName: keyName }, callback);

};