import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Perform a shake action on the device. Supports iOS Simulator and real devices.
 *
 * <example>
    :shake.js
    it('should shake the device', async () => {
        await browser.shake()
    })
 * </example>
 *
 * @support ["ios"]
 */
export async function shake(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `shake` command is only available for mobile platforms.')
    }

    if (!browser.isIOS) {
        throw new Error('The `shake` command is only available for iOS.')
    }

    return executeMobile(browser, 'mobile: shake', {})
}
