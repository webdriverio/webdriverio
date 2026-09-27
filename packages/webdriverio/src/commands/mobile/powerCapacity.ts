import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Set the battery percentage on the Android emulator. Value must be in the range [0, 100].
 *
 * <example>
    :powerCapacity.js
    it('should set battery to 75%', async () => {
        await browser.powerCapacity(75)
    })
 * </example>
 *
 * @param {number}  percent  The battery percentage to set (0–100)
 *
 * @support ["android"]
 */
export async function powerCapacity(
    this: WebdriverIO.Browser,
    percent: number
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `powerCapacity` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `powerCapacity` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: powerCapacity', { percent })
}
