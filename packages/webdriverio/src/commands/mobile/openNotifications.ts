import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Open Android notifications.
 *
 * <example>
    :openNotifications.js
    it('should open the Android notification shade', async () => {
        await browser.openNotifications()
    })
 * </example>
 *
 * @support ["android"]
 */
export async function openNotifications(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `openNotifications` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `openNotifications` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: openNotifications', {})
}
