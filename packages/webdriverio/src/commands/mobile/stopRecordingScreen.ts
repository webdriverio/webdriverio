import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Stop recording the device screen. Returns the recorded video as a base64-encoded string,
 * or an empty string if `remotePath` was provided (the video was uploaded to a remote location).
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :stopRecordingScreen.js
    it('should stop recording the screen', async () => {
        // Stop recording and get base64 video
        const video = await browser.stopRecordingScreen()
        // Stop recording and upload to remote location
        await browser.stopRecordingScreen('https://storage.example.com/video.mp4', 'user', 'pass', 'PUT')
    })
 * </example>
 *
 * @param {string}  [remotePath]   The path to the remote location where the video should be uploaded
 * @param {string}  [username]     Username for remote upload authentication
 * @param {string}  [password]     Password for remote upload authentication
 * @param {string}  [method]       HTTP method to use for remote upload (e.g. PUT or POST)
 *
 * @returns {`Promise<string>`} Base64-encoded video string, or empty string if remotePath was set
 *
 * @support ["ios","android"]
 */
export async function stopRecordingScreen(
    this: WebdriverIO.Browser,
    remotePath?: string,
    username?: string,
    password?: string,
    method?: string
): Promise<string> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `stopRecordingScreen` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: stopRecordingScreen', { remotePath, username, password, method }) as string
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: stopRecordingScreen', '/appium/stop_recording_screen')
        return browser.appiumStopRecordingScreen(remotePath, username, password, method) as Promise<string>
    }
}
