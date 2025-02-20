import type { ActiveAppInfo } from '../../types.js'

/**
 *
 * Performs a restart of the native app by:
 *
 * - terminating the active app
 * - launching the previously active app
 *
 * :::important
 * This command will restart (terminate/close and launch/start) the app and will not reset the app state. Appium can not perform a hard reset of
 * the app unless:
 * - you start a new session and the session handler removes the app state/cleans the device
 * - you have a backdoor in your app to reset the app state and Appium can call this backdoor
 * :::
 *
 * <example>
    :restart.app.js
    it('should restart the app with default options', async () => {
        await browser.restartApp()
    })
 * </example>
 *
 * @uses protocol/execute
 * @type utility
 * @skipUsage
 */
export async function restartApp(
    this: WebdriverIO.Browser
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `restartApp` command is only available for mobile platforms.')
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
