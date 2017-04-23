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

export default function toggleWiFi () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_wifi',
        method: 'POST'
    })
}
