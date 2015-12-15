/**
 *
 * close the app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#close-app
 * @type mobile
 * @for android
 *
 */

let closeApp = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/close',
        method: 'POST'
    })
}

export default closeApp
