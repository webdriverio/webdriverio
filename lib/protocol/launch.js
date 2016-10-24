/**
 *
 * Launch the session for the desired capabilities. Note that this is the companion
 * to the `autoLaunch=false` capability. This is not for launching arbitrary
 * apps/activities --- for that use [`startActivity`](/api/mobile/startActivity.html).
 * This is for continuing the initialization ("launch") process if you have used
 * `autoLaunch=false`.
 *
 * <example>
    :launch.js
    it('should launch capability', function () {
        browser.launch();
    });
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#launch
 * @type mobile
 * @for ios, android
 *
 */

let launch = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/launch',
        method: 'POST'
    })
}

export default launch
