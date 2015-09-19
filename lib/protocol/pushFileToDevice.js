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
let pushFileToDevice = function (pathOnDevice, base64Data) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/push_file',
        method: 'POST'
    }, {
        path: pathOnDevice,
        data: base64Data
    })
}

export default pushFileToDevice
