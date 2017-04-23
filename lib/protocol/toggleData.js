/**
 *
 * Switch the state (enabled/disabled) of data service.
 *
 * <example>
    :toggleData.js
    browser.toggleData()
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

export default function toggleData () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_data',
        method: 'POST'
    })
}
