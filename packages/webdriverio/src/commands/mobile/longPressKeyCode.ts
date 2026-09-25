import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Press and hold a particular key code on the device.
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

    return executeMobile(browser, 'mobile: pressKey', { keycode, metastate, flags, isLongPress: true })
}
