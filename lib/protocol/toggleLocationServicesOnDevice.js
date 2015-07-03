/**
 *
 * Toggle location services on device.
 *
 * <example>
    :toggleLocationServicesOnDevice.js
    client.toggleLocationServicesOnDevice();
 * </example>
 *
 * @type appium
 *
 */

module.exports = function toggleLocationServicesOnDevice() {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_location_services',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};