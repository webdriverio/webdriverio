import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Start an Android activity by providing package name and activity name.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :startActivity.js
    it('should start an Android activity', async () => {
        // Start a specific activity
        await browser.startActivity('com.example.app', '.MainActivity')
        // Start activity and wait for another to appear
        await browser.startActivity('com.example.app', '.SplashActivity', 'com.example.app', '.MainActivity')
    })
 * </example>
 *
 * @param {string}  appPackage                The package name of the app to start
 * @param {string}  appActivity               The activity name to start
 * @param {string}  [appWaitPackage]          The package name to wait for after starting the activity
 * @param {string}  [appWaitActivity]         The activity name to wait for after starting the activity
 * @param {string}  [intentAction]            The intent action to use to start the activity
 * @param {string}  [intentCategory]          The intent category to use to start the activity
 * @param {string}  [intentFlags]             Flags to use when starting the activity
 * @param {string}  [optionalIntentArguments] Additional intent arguments to use when starting the activity
 * @param {string}  [dontStopAppOnReset]      Whether to stop the app before starting the activity
 *
 * @support ["android"]
 */
export async function startActivity(
    this: WebdriverIO.Browser,
    appPackage: string,
    appActivity: string,
    appWaitPackage?: string,
    appWaitActivity?: string,
    intentAction?: string,
    intentCategory?: string,
    intentFlags?: string,
    optionalIntentArguments?: string,
    dontStopAppOnReset?: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `startActivity` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `startActivity` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: startActivity', {
            appPackage,
            appActivity,
            appWaitPackage,
            appWaitActivity,
            intentAction,
            intentCategory,
            intentFlags,
            optionalIntentArguments,
            dontStopAppOnReset
        })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: startActivity', '/appium/device/start_activity')
        return browser.appiumStartActivity(
            appPackage,
            appActivity,
            appWaitPackage,
            appWaitActivity,
            intentAction,
            intentCategory,
            intentFlags,
            optionalIntentArguments,
            dontStopAppOnReset
        )
    }
}
