/**
 *
 * toggle airplane mode on device (Appium specific command)
 *
 * ### Usage:
 *
 *     client.toggleAirplaneModeOnDevice()
 *
 * @type protocol
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