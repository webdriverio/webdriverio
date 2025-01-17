import { environment } from '../../environment.js'

/**
 * Uploads a file to the Selenium Standalone server or other browser driver
 * (e.g. Chromedriver or EdgeDriver) by using the [`file`](https://webdriver.io/docs/api/selenium#file) command.
 * _Note:_ that this command is only supported if you use a Selenium Hub,
 * Chromedriver or EdgeDriver directly.
 *
 * __Note:__ this command uses an un-offical protocol feature that is currently
 * only supported in Chrome and when running a [Selenium Grid](https://www.selenium.dev/documentation/en/grid/).
 *
 * <example>
    :uploadFile.js
    import path from 'node:path'

    it('should upload a file', async () => {
        await browser.url('https://the-internet.herokuapp.com/upload')

        const filePath = '/path/to/some/file.png'
        const remoteFilePath = await browser.uploadFile(filePath)

        await $('#file-upload').setValue(remoteFilePath)
        await $('#file-submit').click()
    });
 * </example>
 *
 * @alias browser.uploadFile
 * @param {string} localPath local path to file
 * @type utility
 * @uses protocol/file
 * @return {String} remote URL
 */
export async function uploadFile (
    this: WebdriverIO.Browser,
    localPath: string
): Promise<string> {
    /**
     * run command implementation based on given environment
     */
    return environment.value.uploadFile.call(this, localPath)
}
