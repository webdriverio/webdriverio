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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_data',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};