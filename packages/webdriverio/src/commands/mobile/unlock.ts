import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Unlock the device screen.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :unlock.js
    it('should unlock the device screen', async () => {
        await browser.unlock()
    })
 * </example>
 *
 * @support ["ios","android"]
 */
export async function unlock(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `unlock` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: unlock', {})
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: unlock', '/appium/device/unlock')
        return browser.appiumUnlock()
    }
}
