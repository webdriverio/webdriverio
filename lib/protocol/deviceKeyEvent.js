/**
 *
 * send a key event to the device
 *
 * @param {Number} keyValue  device specifc key value
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#key-event
 * @type appium
 *
 */

module.exports = function deviceKeyEvent(keycode, metastate) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];
    var data = {
        keycode: keycode
    };

    if(metastate) {
        data.metastate = metastate;
    }

    var requestOptions = {
        path: '/session/:sessionId/appium/device/keyevent',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, data, callback);

};