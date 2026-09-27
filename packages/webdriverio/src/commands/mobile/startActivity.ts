import { executeMobile } from '../../utils/mobile.js'

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
     * Whether to stop the app before starting the activity. Passed as `stop` (inverted) to the new driver API.
     */
    dontStopAppOnReset?: string
}

/**
 *
 * Start an Android activity by providing package name and activity name.
 *
 * <example>
    :startActivity.js
    it('should start an Android activity', async () => {
        await browser.startActivity({
            appPackage: 'com.example.app',
            appActivity: '.MainActivity',
        })
        await browser.startActivity({
            appPackage: 'com.example.app',
            appActivity: '.MainActivity',
            intentAction: 'android.intent.action.MAIN',
            intentCategory: 'android.intent.category.LAUNCHER',
            intentFlags: '0x10200000',
        })
    })
 * </example>
 *
 * @param {StartActivityOptions} options activity options
 * @param {string} options.appPackage package name of the app to start
 * @param {string} options.appActivity activity name to start
 * @param {string=} options.intentAction intent action
 * @param {string=} options.intentCategory intent category
 * @param {string=} options.intentFlags flags for the intent
 * @param {string=} options.dontStopAppOnReset whether to stop the app before starting the activity
 *
 * @support ["android"]
 */
export async function startActivity(
    this: WebdriverIO.Browser,
    options: StartActivityOptions
) {
    const browser = this

    if (typeof options !== 'object' || options === null) {
        throw new Error(
            '`startActivity` only accepts an options object in WebdriverIO v10. ' +
            'Use `browser.startActivity({ appPackage, appActivity })`.'
        )
    }

    const legacyOptions = options as StartActivityOptions & {
        appWaitPackage?: unknown
        appWaitActivity?: unknown
        optionalIntentArguments?: unknown
    }
    if (
        'appWaitPackage' in legacyOptions ||
        'appWaitActivity' in legacyOptions ||
        'optionalIntentArguments' in legacyOptions
    ) {
        throw new Error(
            'The `appWaitPackage`, `appWaitActivity`, and `optionalIntentArguments` options were removed from `startActivity` in WebdriverIO v10. ' +
            'They only applied to the removed Appium HTTP endpoint and are not accepted by `mobile: startActivity`.'
        )
    }

    if (!browser.isMobile) {
        throw new Error('The `startActivity` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `startActivity` command is only available for Android.')
    }

    const mobileArgs: Record<string, unknown> = {
        component: `${options.appPackage}/${options.appActivity}`,
    }
    if (options.intentAction !== undefined) {
        mobileArgs.action = options.intentAction
    }
    if (options.intentCategory !== undefined) {
        mobileArgs.categories = options.intentCategory
    }
    if (options.intentFlags !== undefined) {
        mobileArgs.flags = options.intentFlags
    }
    if (options.dontStopAppOnReset !== undefined) {
        mobileArgs.stop = options.dontStopAppOnReset !== 'true'
    }

    return executeMobile(browser, 'mobile: startActivity', mobileArgs)
}
