import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Retrieve visibility and bounds information of the status and navigation bars.
 *
 * <example>
    :getSystemBars.js
    it('should get system bars info', async () => {
        const bars = await browser.getSystemBars()
        console.log('Status bar:', bars.statusBar)
        console.log('Navigation bar:', bars.navigationBar)
    })
 * </example>
 *
 * @support ["android"]
 */
export async function getSystemBars(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getSystemBars` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `getSystemBars` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: getSystemBars', {})
}
