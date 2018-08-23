/**
 *
 * Press a particular key code on the device.
 *
 * <example>
    :pressKeycode.js
    // press the home button
    browser.pressKeycode('3')
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

export default function pressKeycode (keycode, metastate) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/press_keycode',
        method: 'POST'
    }, { keycode, metastate })
}
