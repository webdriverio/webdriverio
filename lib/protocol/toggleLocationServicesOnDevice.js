/**
 *
 * Toggle location services on device.
 *
 * ### Usage:
 *
 *     client.toggleLocationServicesOnDevice()
 *
 * @type appium
 *
 */

module.exports = function toggleLocationServicesOnDevice() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_location_services',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};