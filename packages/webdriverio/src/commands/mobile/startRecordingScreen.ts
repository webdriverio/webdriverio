import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Start recording the device screen. Various options can be passed to configure video quality,
 * format, and upload location. See Appium documentation for driver-specific options.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :startRecordingScreen.js
    it('should start recording the screen', async () => {
        // Start recording with default settings
        await browser.startRecordingScreen()
        // Start recording with custom options (Android)
        await browser.startRecordingScreen({ videoType: 'mp4', videoQuality: 'high', timeLimit: '180' })
    })
 * </example>
 *
 * @param {Record<string, unknown>}  [options]   Driver-specific options for video quality, format, and upload location
 *
 * @support ["ios","android"]
 */
export async function startRecordingScreen(
    this: WebdriverIO.Browser,
    options?: Record<string, unknown>
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `startRecordingScreen` command is only available for mobile platforms.')
    }

    const mobileCommand = browser.isIOS ? 'mobile: startXCTestScreenRecording' : 'mobile: startMediaProjectionRecording'

    try {
        return await browser.execute(mobileCommand, { options })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning(mobileCommand, '/appium/start_recording_screen')
        return browser.appiumStartRecordingScreen(options)
    }
}
