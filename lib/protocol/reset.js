/**
 *
 * Reset the device.
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
