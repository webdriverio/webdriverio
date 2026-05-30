import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Close a specific app or the currently active app on the device.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * If no `bundleId` (iOS) or `appId` (Android) is provided, the command will automatically detect and close the currently active app.
 *
 * <example>
    :closeApp.js
    it('should close the currently active app', async () => {
        // Automatically close the currently active app
        await browser.closeApp()
    })
    it('should close a specific iOS app by bundleId', async () => {
        // iOS: close a specific app using its bundle ID
        await browser.closeApp({ bundleId: 'com.example.myapp' })
    })
    it('should close a specific Android app by appId', async () => {
        // Android: close a specific app using its package name
        await browser.closeApp({ appId: 'com.example.myapp' })
    })
 * </example>
 *
 * @param {object}  [options]          Options for closing the app (optional)
 * @param {string}  [options.bundleId] The bundle ID of the iOS app to close. If not provided, the currently active app is closed. <br /><strong>iOS-ONLY</strong>
 * @param {string}  [options.appId]    The package name of the Android app to close. If not provided, the currently active app is closed. <br /><strong>ANDROID-ONLY</strong>
 *
 * @support ["ios","android"]
 */
export async function closeApp(
    this: WebdriverIO.Browser,
    options?: {
        bundleId?: string
        appId?: string
    }
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `closeApp` command is only available for mobile platforms.')
    }

    let terminateArgs: Record<string, string>

    if (browser.isIOS) {
        const bundleId = options?.bundleId
            ?? (await browser.execute('mobile: activeAppInfo') as { bundleId: string }).bundleId
        terminateArgs = { bundleId }
    } else {
        const appId = options?.appId ?? await browser.getCurrentPackage()
        terminateArgs = { appId }
    }

    try {
        return await browser.execute('mobile: terminateApp', terminateArgs)
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: terminateApp', '/appium/app/close')
        return browser.appiumCloseApp()
    }
}
