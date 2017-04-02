/**
 *
 * Toggle enroll touchId for IOS Simulator
 *
 * <example>
    :touchId.js
    it('should enroll touchId on simulator', function () {
        browser.toggleTouchIdEnrollment(); // toggles touchId enrollment
    });
 * </example>
 *
 * @param {Boolean} match if true the command simulates a valid fingerprint
 *
 * @type mobile
 * @for  ios
 * @see https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md
 *
 */
export default function toggleTouchIdEnrollment () {
    return this.requestHandler.create('session/:session_id/appium/simulator/toggle_touch_id_enrollment')
}
