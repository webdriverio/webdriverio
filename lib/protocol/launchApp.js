/**
 *
 * launch the app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#launch
 * @type mobile
 * @for android
 *
 */

let launchApp = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/launch',
        method: 'POST'
    })
}

export default launchApp
