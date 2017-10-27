/**
 *
 * Get current device package.
 *
 * <example>
    :getCurrentPackage.js
    it('should get current Android package', function () {
        var package = browser.getCurrentPackage();
        console.log(package); // returns "io.webdriver.guineapig"
    });
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#current-package
 * @type mobile
 * @for android
 *
 */

export default function getCurrentPackage () {
    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/current_package',
        method: 'GET'
    }), {
        extractValue: true
    })
}
