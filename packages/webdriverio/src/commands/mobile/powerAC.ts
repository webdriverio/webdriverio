import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Set the state of the battery charger on the Android emulator. Valid values: 'on', 'off'.
 *
 * <example>
    :powerAC.js
    it('should enable the AC charger', async () => {
        await browser.powerAC('on')
    })
 * </example>
 *
 * @param {string}  state  The charger state to set ('on' or 'off')
 *
 * @support ["android"]
 */
export async function powerAC(
    this: WebdriverIO.Browser,
    state: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `powerAC` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `powerAC` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: powerAC', { state })
}
