/**
 *
 * Simulate the device shaking.
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#shake
 * @type mobile
 * @for android
 *
 */

let shake = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/shake',
        method: 'POST'
    })
}

export default shake
