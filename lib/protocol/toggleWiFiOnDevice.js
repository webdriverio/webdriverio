/**
 *
 * Toggle WiFi on device.
 *
 * <example>
    :toggleWiFiOnDevice.js
    client.toggleWiFiOnDevice()
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

let toggleWiFiOnDevice = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_wifi',
        method: 'POST'
    })
}

export default toggleWiFiOnDevice
