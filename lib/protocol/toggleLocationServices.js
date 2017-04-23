/**
 *
 * Switch the state (enabled/disabled) of the location service.
 *
 * <example>
    :toggleLocationServices.js
    browser.toggleLocationServices();
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

export default function toggleLocationServices () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_location_services',
        method: 'POST'
    })
}
