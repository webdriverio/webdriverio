/**
 *
 * Press a particular key code on the device.
 *
 * <example>
    :longPressKeycode.js
    // press the home button long
    browser.longPressKeycode(3)
 * </example>
 *
 * @param {String} keycode    key code to press
 * @param {String} metastate  meta state to be activated
 *
 * @see http://developer.android.com/reference/android/view/KeyEvent.html
 * @type mobile
 * @for android
 *
 */

export default function longPressKeycode (keycode, metastate) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/long_press_keycode',
        method: 'POST'
    }, { keycode, metastate })
}
