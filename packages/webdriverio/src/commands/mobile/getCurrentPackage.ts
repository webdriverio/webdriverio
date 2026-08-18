import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Get the name of the current Android package.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :getCurrentPackage.js
    it('should get the current Android package', async () => {
        const pkg = await browser.getCurrentPackage()
        console.log('Current package:', pkg)
    })
 * </example>
 *
 * @returns {`Promise<string>`} The name of the current Android package
 *
 * @support ["android"]
 */
export async function getCurrentPackage(
    this: WebdriverIO.Browser
): Promise<string> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getCurrentPackage` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `getCurrentPackage` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: getCurrentPackage', {}) as string
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: getCurrentPackage', '/appium/device/current_package')
        return browser.appiumGetCurrentPackage() as Promise<string>
    }
}
