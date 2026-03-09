import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Get the state of a given application on the device.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * Returns one of the following numeric states:
 * - `0` — Not installed
 * - `1` — Not running
 * - `2` — Running in background (suspended)
 * - `3` — Running in background
 * - `4` — Running in foreground
 *
 * <example>
    :queryAppState.js
    it('should get the app state', async () => {
        // Check app state on Android
        const state = await browser.queryAppState('com.example.app')
        // Check app state on iOS
        const iosState = await browser.queryAppState(undefined, 'com.example.app')
    })
 * </example>
 *
 * @param {string} [appId]      Application package name (Android).
 * @param {string} [bundleId]   Application bundle identifier (iOS).
 *
 * @returns {`Promise<number>`} The application state (0–4).
 *
 * @support ["ios","android"]
 */
export async function queryAppState(
    this: WebdriverIO.Browser,
    appId?: string,
    bundleId?: string
): Promise<number> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `queryAppState` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: queryAppState', { appId, bundleId }) as number
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: queryAppState', '/appium/device/app_state')
        return browser.appiumQueryAppState(appId, bundleId) as Promise<number>
    }
}
