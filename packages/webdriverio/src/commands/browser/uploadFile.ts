import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import type { Capabilities } from '@wdio/types'

import type { Browser } from '../../types'

/**
 * Uploads a file to the Selenium Standalone server or other browser driver
 * (e.g. Chromedriver) by using the [`file`](/docs/api/selenium.html#file) command.
 * _Note:_ that this command is only supported if you use a Selenium Hub or
 * Chromedriver directly.
 *
 * __Note:__ this command uses an un-offical protocol feature that is currently
 * only supported in Chrome and when running a [Selenium Grid](https://www.selenium.dev/documentation/en/grid/).
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
export default async function uploadFile (
    this: Browser,
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
        throw new Error(`The uploadFile command is not available in ${(this.capabilities as Capabilities.Capabilities).browserName}`)
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
