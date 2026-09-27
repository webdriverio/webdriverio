import { environment } from '../../environment.js'

/**
 *
 * Save a video started by a driver `mobile:` screen-recording execute method to a file.
 *
 * :::info
 *
 * This command is only supported for mobile sessions running on [Appium](https://appium.io/).
 * Start recording with the driver-specific execute method first, for example
 * `mobile: startXCTestScreenRecording` (iOS) or `mobile: startMediaProjectionRecording` (Android).
 *
 * :::
 *
 * <example>
    :saveRecordingScreen.js
    it('should save a video', async () => {
        await browser.execute('mobile: startMediaProjectionRecording', {})
        await $('~BUTTON').click()
        await browser.saveRecordingScreen('./some/path/video.mp4')
    })
 * </example>
 *
 * @alias browser.saveRecordingScreen
 * @param   {String}  filepath  full or relative to the execution directory path to the generated video
 * @return  {Buffer}            video buffer
 * @type utility
 *
 */
export async function saveRecordingScreen (
    this: WebdriverIO.Browser,
    filepath: string
): Promise<Buffer<ArrayBuffer>> {
    /**
     * run command implementation based on given environment
     */
    return environment.value.saveRecordingScreen.call(this, filepath)
}
