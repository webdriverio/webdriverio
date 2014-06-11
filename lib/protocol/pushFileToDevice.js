/**
 *
 * push file to device (Appium specific command)
 *
 * ### Usage:
 *
 *     client.pushFileToDevice(pathOnDevice, base64Data)
 *
 */

module.exports = function pushFileToDevice(pathOnDevice, base64Data) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/push_file',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, { path: pathOnDevice, data: base64Data }, callback);

};