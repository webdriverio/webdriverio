/**
 *
 * push file to device (Appium specific command)
 *
 * ### Usage:
 *
 *     client.pullFileFromDevice(pathOnDevice)
 *
 */

module.exports = function pullFileFromDevice(pathOnDevice) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/pull_file',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, { path: pathOnDevice }, callback);

};