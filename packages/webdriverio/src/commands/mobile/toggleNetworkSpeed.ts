import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Set the network speed for the Android emulator. Valid values: 'full', 'gsm', 'edge', 'hscsd',
 * 'gprs', 'umts', 'hsdpa', 'lte', 'evdo'.
 *
 * <example>
    :toggleNetworkSpeed.js
    it('should set network speed to LTE', async () => {
        await browser.toggleNetworkSpeed('lte')
    })
 * </example>
 *
 * @param {string}  netspeed  The network speed preset to apply ('full', 'gsm', 'edge', 'hscsd', 'gprs', 'umts', 'hsdpa', 'lte', 'evdo')
 *
 * @support ["android"]
 */
export async function toggleNetworkSpeed(
    this: WebdriverIO.Browser,
    netspeed: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `toggleNetworkSpeed` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `toggleNetworkSpeed` command is only available for Android.')
    }

    return executeMobile(browser, 'mobile: networkSpeed', { netspeed })
}
