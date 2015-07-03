/**
 *
 * Toggle data on device.
 *
 * <example>
    :toggleDataOnDevice.js
    client.toggleDataOnDevice()
 * </example>
 *
 * @type appium
 *
 */

module.exports = function toggleDataOnDevice() {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_data',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};