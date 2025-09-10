import type { ActiveAppInfo } from '../../types.js'

/**
 *
 * Performs a restart of the active native app by:
 *
 * - terminating the active app
 * - launching the previously active app
 *
 * :::important
 * This command will restart (terminate/close and launch/start) the current active app and will NOT reset the app state. Appium can not perform a hard reset of
 * the app unless:
 *
 * - you start a new session and the session handler removes the app state/cleans the device
 * - you have a backdoor in your app to reset the app state and Appium can call this backdoor
 *
 * If you want to reset the app state for Android or iOS you need to create your own reset mechanism/command in your script. Options could be:
 *
 * - Android: Use the `adb` command to clear the app data: `adb shell pm clear <appPackage>`
 * - iOS: reinstall the app using the `mobile: installApp` command
 * - ....
 * - not use this command
 *
 * The options you have depend on the platform, the app and the location (local with most of the times full access to the device, or in the cloud with less access) you are testing.
 *
 * :::
 *
 * <example>
    :restart.app.js
    it('should restart the app with default options', async () => {
        await browser.relaunchActiveApp()
    })
 * </example>
 *
 * @uses protocol/execute
 * @type utility
 * @skipUsage
 */
export async function relaunchActiveApp(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `relaunchActiveApp` command is only available for mobile platforms.')
    }

    if (browser.isIOS) {
        const { bundleId, processArguments: { args, env } } = await browser.execute('mobile: activeAppInfo') as ActiveAppInfo
        const iOSLaunchOptions = {
            bundleId,
            ...(args.length > 0 && { arguments: args }),
            ...(Object.keys(env).length > 0 && { environment: env })
        }
        await browser.execute('mobile: terminateApp', { bundleId })

        return browser.execute('mobile:launchApp', iOSLaunchOptions)
    }

    const packageName = await browser.getCurrentPackage()

    await browser.execute('mobile: terminateApp', { appId: packageName })

    return browser.execute('mobile: activateApp', { appId: packageName })
}
