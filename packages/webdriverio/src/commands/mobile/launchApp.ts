import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Launch or activate an app on the device. If no `bundleId` (iOS) or `appId` (Android) is provided,
 * the command will automatically detect and activate the currently active app.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :launchApp.js
    it('should launch a specific iOS app', async () => {
        // iOS: launch a specific app by bundle ID
        await browser.launchApp({ bundleId: 'com.example.myapp' })
    })
    it('should launch an iOS app with arguments and environment', async () => {
        // iOS: launch an app and pass arguments and environment variables
        await browser.launchApp({
            bundleId: 'com.example.myapp',
            arguments: ['-AppleLanguages', '(en)'],
            environment: { MY_ENV_VAR: 'value' }
        })
    })
    it('should launch a specific Android app', async () => {
        // Android: activate/launch a specific app by package name
        await browser.launchApp({ appId: 'com.example.myapp' })
    })
    it('should activate the currently active app', async () => {
        // Automatically detect and activate the current app
        await browser.launchApp()
    })
 * </example>
 *
 * @param {object}            [options]              Options for launching the app (optional)
 * @param {string}            [options.bundleId]     The bundle ID of the iOS app to launch. If not provided, the currently active app is used. <br /><strong>iOS-ONLY</strong>
 * @param {string|string[]}   [options.arguments]    Command line arguments to pass to the app on launch. <br /><strong>iOS-ONLY</strong>
 * @param {object}            [options.environment]  Environment variables to set when launching the app (key-value pairs). <br /><strong>iOS-ONLY</strong>
 * @param {string}            [options.appId]        The package name of the Android app to activate. If not provided, the currently active app is used. <br /><strong>ANDROID-ONLY</strong>
 *
 * @support ["ios","android"]
 */
export async function launchApp(
    this: WebdriverIO.Browser,
    options?: {
        bundleId?: string
        arguments?: string | string[]
        environment?: Record<string, string>
        appId?: string
    }
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `launchApp` command is only available for mobile platforms.')
    }

    let mobileCmd: string
    let mobileArgs: Record<string, unknown>

    if (browser.isIOS) {
        mobileCmd = 'mobile: launchApp'
        const bundleId = options?.bundleId
            ?? (await browser.execute('mobile: activeAppInfo') as { bundleId: string }).bundleId
        mobileArgs = { bundleId }
        if (options?.arguments !== undefined) {
            mobileArgs.arguments = options.arguments
        }
        if (options?.environment !== undefined) {
            mobileArgs.environment = options.environment
        }
    } else {
        mobileCmd = 'mobile: activateApp'
        const appId = options?.appId ?? await browser.getCurrentPackage()
        mobileArgs = { appId }
    }

    try {
        return await browser.execute(mobileCmd, mobileArgs)
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning(mobileCmd, '/appium/app/launch')
        return browser.appiumLaunchApp()
    }
}
