import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

export interface StartActivityOptions {
    /**
     * The package name of the app to start.
     */
    appPackage: string
    /**
     * The activity name to start.
     */
    appActivity: string
    /**
     * The package name to wait for after starting the activity. Passed to the legacy fallback only.
     * <br /><strong>LEGACY-ONLY</strong>
     */
    appWaitPackage?: string
    /**
     * The activity name to wait for after starting the activity. Passed to the legacy fallback only.
     * <br /><strong>LEGACY-ONLY</strong>
     */
    appWaitActivity?: string
    /**
     * The intent action to use to start the activity (maps to `action` in the new driver API).
     */
    intentAction?: string
    /**
     * The intent category to use to start the activity (maps to `categories` in the new driver API).
     */
    intentCategory?: string
    /**
     * Flags to use when starting the activity (maps to `flags` in the new driver API).
     */
    intentFlags?: string
    /**
     * Additional intent arguments. Passed to the legacy fallback only.
     * <br /><strong>LEGACY-ONLY</strong>
     */
    optionalIntentArguments?: string
    /**
     * Whether to stop the app before starting the activity. Passed as `stop` (inverted) to the new driver API.
     */
    dontStopAppOnReset?: string
}

/**
 *
 * Start an Android activity by providing package name and activity name.
 *
 * Supports both the legacy positional argument style and a new object-based style.
 * When the first argument is an object, the object properties are used. When it is a
 * string, the call is treated as the old positional API for backward compatibility.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :startActivity.js
    it('should start an Android activity (object API)', async () => {
        // New object-based API
        await browser.startActivity({
            appPackage: 'com.example.app',
            appActivity: '.MainActivity',
        })
        // With optional intent parameters
        await browser.startActivity({
            appPackage: 'com.example.app',
            appActivity: '.MainActivity',
            intentAction: 'android.intent.action.MAIN',
            intentCategory: 'android.intent.category.LAUNCHER',
            intentFlags: '0x10200000',
        })
    })
    it('should start an Android activity (legacy positional API)', async () => {
        // Legacy positional API (backward compatible)
        await browser.startActivity('com.example.app', '.MainActivity')
        // With wait package/activity
        await browser.startActivity('com.example.app', '.SplashActivity', 'com.example.app', '.MainActivity')
    })
 * </example>
 *
 * @param {StartActivityOptions|string}  appPackageOrOptions       The package name of the app to start, or an options object.
 * @param {string}                       [appActivity]             The activity name to start (only used when first arg is a string).
 * @param {string}                       [appWaitPackage]          The package name to wait for (legacy, only used when first arg is a string). <br /><strong>LEGACY-ONLY</strong>
 * @param {string}                       [appWaitActivity]         The activity name to wait for (legacy, only used when first arg is a string). <br /><strong>LEGACY-ONLY</strong>
 * @param {string}                       [intentAction]            The intent action (legacy positional, only used when first arg is a string).
 * @param {string}                       [intentCategory]          The intent category (legacy positional, only used when first arg is a string).
 * @param {string}                       [intentFlags]             Flags for the intent (legacy positional, only used when first arg is a string).
 * @param {string}                       [optionalIntentArguments] Additional intent arguments (legacy, only used when first arg is a string). <br /><strong>LEGACY-ONLY</strong>
 * @param {string}                       [dontStopAppOnReset]      Whether to stop the app before starting the activity (legacy positional, only used when first arg is a string).
 *
 * @support ["android"]
 */
export async function startActivity(
    this: WebdriverIO.Browser,
    appPackageOrOptions: StartActivityOptions | string,
    appActivity?: string,
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

    // Normalize args — support both object-based and legacy positional APIs
    const opts: StartActivityOptions = typeof appPackageOrOptions === 'object' ? appPackageOrOptions : {
        appPackage: appPackageOrOptions,
        appActivity: appActivity!,
        appWaitPackage,
        appWaitActivity,
        intentAction,
        intentCategory,
        intentFlags,
        optionalIntentArguments,
        dontStopAppOnReset,
    }

    // Build args for the new UiAutomator2 mobile: startActivity format
    const mobileArgs: Record<string, unknown> = {
        component: `${opts.appPackage}/${opts.appActivity}`,
    }
    if (opts.intentAction !== undefined) {
        mobileArgs.action = opts.intentAction
    }
    if (opts.intentCategory !== undefined) {
        mobileArgs.categories = opts.intentCategory
    }
    if (opts.intentFlags !== undefined) {
        mobileArgs.flags = opts.intentFlags
    }
    if (opts.dontStopAppOnReset !== undefined) {
        mobileArgs.stop = opts.dontStopAppOnReset !== 'true'
    }

    try {
        return await browser.execute('mobile: startActivity', mobileArgs)
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: startActivity', '/appium/device/start_activity')
        return browser.appiumStartActivity(
            opts.appPackage,
            opts.appActivity,
            opts.appWaitPackage,
            opts.appWaitActivity,
            opts.intentAction,
            opts.intentCategory,
            opts.intentFlags,
            opts.optionalIntentArguments,
            opts.dontStopAppOnReset
        )
    }
}
