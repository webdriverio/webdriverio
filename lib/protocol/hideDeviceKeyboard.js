/**
 *
 * Hide the keyboard (iOS only).
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#hide-keyboard-ios-only
 * @type mobile
 * @for android
 *
 */

let hideDeviceKeyboard = function (keyName) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/hide_keyboard',
        method: 'POST'
    }, {
        keyName: keyName
    })
}

export default hideDeviceKeyboard
