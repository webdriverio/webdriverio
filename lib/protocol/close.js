/**
 *
 * Close the given application.
 *
 * <example>
    :closeApp.js
    browser.close()
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#close-app
 * @type mobile
 * @for ios
 *
 */

let close = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/close',
        method: 'POST'
    })
}

export default close
