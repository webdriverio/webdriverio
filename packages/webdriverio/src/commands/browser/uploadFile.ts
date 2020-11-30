/**
 * Uploads a file to the Selenium Standalone server or other browser driver
 * (e.g. Chromedriver) by using the [`file`](/docs/api/selenium.html#file) command.
 * _Note:_ that this command is only supported if you use a Selenium Hub or
 * Chromedriver directly.
 *
 * <example>
    :touchAction.js
    const path = require('path');

    it('should upload a file', function () {
        browser.url('https://the-internet.herokuapp.com/upload')

        const filePath = '/path/to/some/file.png'
        const remoteFilePath = browser.uploadFile(filePath)

        $('#file-upload').setValue(remoteFilePath)
        $('#file-submit').click()
    });
 * </example>
 *
 * @alias browser.uploadFile
 * @param {String} localPath local path to file
 * @type utility
 * @uses protocol/file
 * @return {String} remote URL
 */
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

export default async function uploadFile (
    this: WebdriverIO.BrowserObject,
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
        throw new Error(`The uploadFile command is not available in ${this.capabilities.browserName}`)
    }

    let zipData: Uint8Array[] = []
    let source = fs.createReadStream(localPath)

    return new Promise((resolve, reject) => {
        archiver('zip')
            .on('error', (err: Error) => reject(err))
            .on('data', (data: Uint8Array) => zipData.push(data))
            .on('end', () => this.file(
                Buffer.concat(zipData).toString('base64')
            ).then((localPath) => resolve(localPath), reject))
            .append(source, { name: path.basename(localPath) })
            .finalize()
    })
}
