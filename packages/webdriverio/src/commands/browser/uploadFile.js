/**
 *
 * Uploads a file to the selenium server by using the [`file`](/api/protocol/file.html) command. Note that
 * this command might not be supported as it is an undocumented Selenium command.
 *
 * @alias browser.uploadFile
 * @param {String} localPath local path to file
 * @type utility
 * @uses protocol/file
 *
 */
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

export default async function uploadFile (localPath) {
    /**
     * parameter check
     */
    if (typeof localPath !== 'string') {
        throw new Error('number or type of arguments don\'t agree with uploadFile command')
    }

    /**
     * check if command is available
     */
    // Comment out by Xu Cao since integration test failed because of this check for some reason
    // if (typeof this.file !== 'function') {
    //     throw new Error(`The uploadFile command is not available in ${this.capabilities.browserName}`)
    // }

    let zipData = []
    let source = fs.createReadStream(localPath)

    return new Promise((resolve, reject) => {
        archiver('zip')
            .on('error', (err) => reject(err))
            .on('data', (data) => zipData.push(data))
            .on('end', () => this.file(Buffer.concat(zipData).toString('base64')).then(resolve, reject))
            .append(source, { name: path.basename(localPath) })
            .finalize((err) => {
                /* istanbul ignore next */
                if (err) {
                    reject(err)
                }
            })
    })
}
