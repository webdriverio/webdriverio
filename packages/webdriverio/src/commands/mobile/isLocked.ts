import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Check whether the device screen is locked.
 *
 * <example>
    :isLocked.js
    it('should check if the device is locked', async () => {
        const locked = await browser.isLocked()
        console.log('Device is locked:', locked)
    })
 * </example>
 *
 * @returns {`Promise<boolean>`} `true` if the device is locked, `false` otherwise
 *
 * @support ["ios","android"]
 */
export async function isLocked(
    this: WebdriverIO.Browser
): Promise<boolean> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `isLocked` command is only available for mobile platforms.')
    }

    return executeMobile<boolean>(browser, 'mobile: isLocked', {})
}
