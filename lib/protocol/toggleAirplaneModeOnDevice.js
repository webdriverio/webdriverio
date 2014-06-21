/**
 *
 * toggle airplane mode on device
 *
 * ### Usage:
 *
 *     client.toggleAirplaneModeOnDevice()
 *
 * @type appium
 *
 */

module.exports = function toggleAirplaneModeOnDevice() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_airplane_mode',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};