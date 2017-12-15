/**
 *
 * Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
 *
 * <example>
    :touchId.js
    it('should simulate fingerprint', function () {
        browser.touchId(); // simulates valid fingerprint
        browser.touchId(true); // simulates valid fingerprint
        browser.touchId(false); // simulates invalid fingerprint
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

export default function touchId (match = true) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/simulator/touch_id',
        method: 'POST'
    }, { match })
}
