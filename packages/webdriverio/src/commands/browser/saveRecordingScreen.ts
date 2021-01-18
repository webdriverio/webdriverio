import fs from 'fs'
import { getAbsoluteFilepath, assertDirectoryExists } from '../../utils'

/**
 *
 * Appium only. Save a video started by startRecordingScreen command to file.
 * See [Appium docs](http://appium.io/docs/en/commands/device/recording-screen/start-recording-screen/)
 *
 * <example>
    :saveRecordingScreen.js
    it('should save a video', () => {
        browser.startRecordingScreen();
        $('~BUTTON').click();
        browser.saveRecordingScreen('./some/path/video.mp4');
    });
 * </example>
 *
 * @alias browser.saveRecordingScreen
 * @param   {String}  filepath  full or relative to the execution directory path to the generated video
 * @return  {Buffer}            video buffer
 * @type utility
 *
 */
export default async function saveRecordingScreen (
    this: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    filepath: string
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string') {
        throw new Error('saveRecordingScreen expects a filepath')
    }

    const absoluteFilepath = getAbsoluteFilepath(filepath)
    assertDirectoryExists(absoluteFilepath)

    const videoBuffer = await this.stopRecordingScreen()
    const video = Buffer.from(videoBuffer, 'base64')
    fs.writeFileSync(absoluteFilepath, video)

    return video
}
