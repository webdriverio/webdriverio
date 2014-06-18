/**
 *
 * toggle data on device (Appium specific command)
 *
 * ### Usage:
 *
 *     client.toggleDataOnDevice()
 *
 * @type protocol
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