/**
 *
 * Pulls a file from the device.
 *
 * @param {String} path  device path to file
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#pull-file
 * @type mobile
 * @for android
 *
 */

let pullFileFromDevice = function (pathOnDevice) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/pull_file',
        method: 'POST'
    }, {
        path: pathOnDevice
    })
}

export default pullFileFromDevice
