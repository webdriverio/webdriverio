import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Get the name of the current Android package.
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

    return executeMobile<string>(browser, 'mobile: getCurrentPackage', {})
}
