import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Press and hold a particular key code on the device.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :longPressKeyCode.js
    it('should long press the Home button', async () => {
        await browser.longPressKeyCode(3)
    })
 * </example>
 *
 * @param {number}  keycode      The keycode to long-press (Android KeyEvent constant)
 * @param {number}  [metastate]  Meta state to apply during the key press (e.g. shift, ctrl)
 * @param {number}  [flags]      Integer flags for the key event
 *
 * @support ["android"]
 */
export async function longPressKeyCode(
    this: WebdriverIO.Browser,
    keycode: number,
    metastate?: number,
    flags?: number
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `longPressKeyCode` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `longPressKeyCode` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: pressKey', { keycode, metastate, flags, isLongPress: true })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: pressKey', '/appium/device/long_press_keycode')
        return browser.appiumLongPressKeyCode(keycode, metastate, flags)
    }
}
