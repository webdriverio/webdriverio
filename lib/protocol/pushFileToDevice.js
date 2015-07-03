/**
 *
 * Push a file to the device.
 *
 * @param {String} path  local path to file
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#push-file
 * @type appium
 *
 */
module.exports = function pushFileToDevice(pathOnDevice, base64Data) {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/push_file',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, { path: pathOnDevice, data: base64Data });

};
