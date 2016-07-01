/**
 *
 * Given a selector corresponding to an `<input type=file>`, will upload the local
 * file to the browser machine and fill the form accordingly. It does not submit
 * the form for you.
 *
 * @alias browser.chooseFile
 * @param {String} selector   input element
 * @param {String} localPath  local path to file to be uploaded
 * @uses utility/uploadFile, action/addValue
 * @type utility
 *
 */

import fs from 'fs'
import { CommandError } from '../utils/ErrorHandler'

let chooseFile = function (selector, localPath) {
    /*!
     * parameter check
     */
    if (typeof localPath !== 'string') {
        return new CommandError('number or type of arguments don\'t agree with chooseFile command')
    }

    /*!
     * mobile check
     */
    if (this.isMobile) {
        return new CommandError('chooseFile command is not supported on mobile platforms')
    }

    return new Promise((resolve, reject) => {
        fs.exists(localPath, (exists) => {
            /* istanbul ignore next */
            if (!exists) {
                return reject(new CommandError('File to upload does not exists on your system'))
            }

            this.uploadFile(localPath).then(function (res) {
                return this.addValue(selector, res.value)
            }).then(resolve, reject)
        })
    })
}

export default chooseFile
