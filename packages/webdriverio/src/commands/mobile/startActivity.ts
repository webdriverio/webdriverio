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
 * @param {string=} options.appWaitPackage package name to wait for. <br /><strong>LEGACY-ONLY</strong>
 * @param {string=} options.appWaitActivity activity name to wait for. <br /><strong>LEGACY-ONLY</strong>
 * @param {string=} options.intentAction intent action
 * @param {string=} options.intentCategory intent category
 * @param {string=} options.intentFlags flags for the intent
 * @param {string=} options.optionalIntentArguments additional intent arguments. <br /><strong>LEGACY-ONLY</strong>
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
