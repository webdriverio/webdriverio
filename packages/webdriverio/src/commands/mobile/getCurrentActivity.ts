import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Get the name of the current Android activity.
 *
 * <example>
    :getCurrentActivity.js
    it('should get the current Android activity', async () => {
        const activity = await browser.getCurrentActivity()
        console.log('Current activity:', activity)
    })
 * </example>
 *
 * @returns {`Promise<string>`} The name of the current Android activity
 *
 * @support ["android"]
 */
export async function getCurrentActivity(
    this: WebdriverIO.Browser
): Promise<string> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getCurrentActivity` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `getCurrentActivity` command is only available for Android.')
    }

    return executeMobile<string>(browser, 'mobile: getCurrentActivity', {})
}
