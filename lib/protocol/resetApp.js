/**
 *
 * reset an app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#reset
 * @type appium
 *
 */

let resetApp = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/reset',
        method: 'POST'
    })
}

export default resetApp
