import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Set the state of the battery charger on the Android emulator. Valid values: 'on', 'off'.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
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

    try {
        return await browser.execute('mobile: powerAC', { state })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: powerAC', '/appium/device/power_ac')
        return browser.appiumPowerAC(state)
    }
}
