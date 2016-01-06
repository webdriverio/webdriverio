/**
 *
 * Reset the device by clearing the device un- and reinstalling app package (if existing).
 *
 * <example>
    :resetApp.js
    browser.reset()
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#reset
 * @type mobile
 * @for android
 *
 */

let reset = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/reset',
        method: 'POST'
    })
}

export default reset
