/**
 *
 * toggle airplane mode on device
 *
 * <example>
    :toggleAirplaneModeOnDevice.js
    client.toggleAirplaneModeOnDevice()
 * </example>
 *
 * @type appium
 *
 */

let toggleAirplaneModeOnDevice = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_airplane_mode',
        method: 'POST'
    })
}

export default toggleAirplaneModeOnDevice
