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

import { CommandError } from '../utils/ErrorHandler'

let uploadFile = function (localPath) {
    /*!
     * parameter check
     */
    if (typeof localPath !== 'string') {
        throw new CommandError('number or type of arguments don\'t agree with uploadFile command')
    }

    let zipData = []
    let source = fs.createReadStream(localPath)

    return new Promise((resolve, reject) => {
        archiver('zip')
            .on('error', (e) => { throw new Error(e) })
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

export default uploadFile
