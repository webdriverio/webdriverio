/**
 *
 * Switch the state (enabled/disabled) of airplane mode.
 *
 * <example>
    :toggleAirplaneMode.js
    browser.toggleAirplaneMode()
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

export default function toggleAirplaneMode () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_airplane_mode',
        method: 'POST'
    })
}
