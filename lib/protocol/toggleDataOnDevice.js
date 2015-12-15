/**
 *
 * Toggle data on device.
 *
 * <example>
    :toggleDataOnDevice.js
    client.toggleDataOnDevice()
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

let toggleDataOnDevice = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_data',
        method: 'POST'
    })
}

export default toggleDataOnDevice
