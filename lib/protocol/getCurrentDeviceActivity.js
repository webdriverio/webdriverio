/**
 *
 * Get current device activity.
 *
 * <example>
    :getCurrentDeviceActivity.js
    it('should get current Android activity', function () {
        var activity = browser.getCurrentDeviceActivity();
        console.log(activity); // returns ".MainActivity"
    });
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#current-activity
 * @type mobile
 * @for android
 *
 */

export default function getCurrentDeviceActivity () {
    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/current_activity',
        method: 'GET'
    }), {
        extractValue: true
    })
}
