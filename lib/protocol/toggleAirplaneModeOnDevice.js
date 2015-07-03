/**
 *
 * toggle airplane mode on device
 *
 * <example>
    :toggleAirplaneModeOnDevice.js
    client.toggleAirplaneModeOnDevice()
 * </example>
 *
 * @type appium
 *
 */

module.exports = function toggleAirplaneModeOnDevice() {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_airplane_mode',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};