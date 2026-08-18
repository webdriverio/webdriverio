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
        // Unlock with no arguments (iOS or Android with default settings)
        await browser.unlock()
    })
    it('should unlock Android with a PIN', async () => {
        // Android-only: unlock using locksettings strategy with a PIN
        await browser.unlock({
            strategy: 'locksettings',
            unlockType: 'pin',
            unlockKey: '1234'
        })
    })
    it('should unlock Android with a custom timeout', async () => {
        // Android-only: unlock with a custom timeout
        await browser.unlock({ timeoutMs: 5000 })
    })
 * </example>
 *
 * @param {object}  [options]               Unlock options (Android only)
 * @param {string}  [options.strategy]      The unlock strategy to use. Accepted values: `'locksettings'` (default) or `'uiautomator'`. <br /><strong>ANDROID-ONLY</strong>
 * @param {number}  [options.timeoutMs]     The timeout in milliseconds to wait for the unlock to complete. Default is `2000`. <br /><strong>ANDROID-ONLY</strong>
 * @param {string}  [options.unlockKey]     The PIN, password, or pattern to use for unlocking. Required when the device has a PIN/password lock. <br /><strong>ANDROID-ONLY</strong>
 * @param {string}  [options.unlockType]    The type of lock mechanism on the device (e.g. `'pin'`, `'password'`, `'pattern'`). <br /><strong>ANDROID-ONLY</strong>
 *
 * @support ["ios","android"]
 */
export async function unlock(
    this: WebdriverIO.Browser,
    options?: {
        strategy?: 'locksettings' | 'uiautomator'
        timeoutMs?: number
        unlockKey?: string
        unlockType?: string
    }
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `unlock` command is only available for mobile platforms.')
    }

    const args = browser.isAndroid && options
        ? { ...options }
        : {}

    try {
        return await browser.execute('mobile: unlock', args)
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: unlock', '/appium/device/unlock')
        return browser.appiumUnlock()
    }
}
