/**
 *
 * send specific key event to device (Appium specific command)
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