/**
 *
 * Switch the state (enabled/disabled) of the wifi service.
 *
 * <example>
    :toggleWiFi.js
    client.toggleWiFi()
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

let toggleWiFi = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_wifi',
        method: 'POST'
    })
}

export default toggleWiFi
