import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

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
     * parameter check
     */
    if (typeof localPath !== 'string') {
        throw new Error('number or type of arguments don\'t agree with uploadFile command')
    }

    /**
     * check if command is available
     */
    if (typeof this.file !== 'function') {
        throw new Error(`The uploadFile command is not available in ${(this.capabilities as WebdriverIO.Capabilities).browserName}`)
    }

    const zipData: Uint8Array[] = []
    const source = fs.createReadStream(localPath)

    return new Promise((resolve, reject) => {
        archiver('zip')
            .on('error', (err: Error) => reject(err))
            .on('data', (data: Uint8Array) => zipData.push(data))
            .on('end', () => (
                this.file(Buffer.concat(zipData).toString('base64'))
                    .then((localPath) => resolve(localPath), reject)
            ))
            .append(source, { name: path.basename(localPath) })
            .finalize()
    })
}
