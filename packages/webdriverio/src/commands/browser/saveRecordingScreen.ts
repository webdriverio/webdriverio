import { environment } from '../../environment.js'

/**
 *
 * Save a video started by [`startRecordingScreen`](/docs/api/appium#startrecordingscreen) command to file.
 *
 * :::info
 *
 * This command is only supported for mobile sessions running on [Appium](https://appium.github.io/appium.io/docs/en/commands/device/recording-screen/start-recording-screen/).
 *
 * :::
 *
 * <example>
    :saveRecordingScreen.js
    it('should save a video', async () => {
        await browser.startRecordingScreen();
        await $('~BUTTON').click();
        await browser.saveRecordingScreen('./some/path/video.mp4');
    });
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
