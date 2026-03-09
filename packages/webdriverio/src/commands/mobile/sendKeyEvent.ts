import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Send a key event to the Android device.
 *
 * This command is the legacy Android key event API. For new tests, prefer using
 * `pressKeyCode()` with numeric keycodes from the Android `KeyEvent` constants.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :sendKeyEvent.js
    it('should send a key event', async () => {
        // Send the Home key event (keycode '3')
        await browser.sendKeyEvent('3')
    })
 * </example>
 *
 * @param {string}  keycode     The keycode to send (as a string, e.g. '3' for Home)
 * @param {string}  [metastate] Meta state to press the keycode with (e.g. '1' for Shift)
 *
 * @support ["android"]
 */
export async function sendKeyEvent(
    this: WebdriverIO.Browser,
    keycode: string,
    metastate?: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `sendKeyEvent` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `sendKeyEvent` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: pressKey', { keycode, metastate })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }
        logAppiumDeprecationWarning('mobile: pressKey', '/appium/device/keyevent')
        return browser.appiumSendKeyEvent(keycode, metastate)
    }
}
