/**
 *
 * Hide the keyboard.
 *
 * <example>
    :hideKeyboardDefault.js
    browser.hideDeviceKeyboard() // taps outside to hide keyboard

    :hideKeyboardWithTap.js
    browser.hideDeviceKeyboard('tapOutside')

    :hideKeyboardDone.js
    browser.hideDeviceKeyboard('pressKey', 'Done')
 * </example>
 *
 * @param {String} strategy  desired strategy to close keyboard ('tapOutside' or 'pressKey')
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#hide-keyboard-ios-only
 * @type mobile
 * @for ios, android
 *
 */

let hideDeviceKeyboard = function (strategy = 'tapOutside', key) {
    let args = { strategy }

    if (key) {
        args.key = key
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/hide_keyboard',
        method: 'POST'
    }, args)
}

export default hideDeviceKeyboard
