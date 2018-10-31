/**
 *
 * Save a screenshot of an element to a PNG file on your OS.
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser view', function () {
        const elem = $('#someElem');
        elem.saveScreenshot('./some/path/elemScreenshot.png');
    });
 * </example>
 *
 * @alias element.saveScreenshot
 * @param   {String}  filename  path to the generated image (relative to the execution directory)
 * @return  {Buffer}            screenshot buffer
 * @type utility
 *
 */

import fs from 'fs'
import path from 'path'
import { Buffer } from 'safe-buffer'

export default async function saveScreenshot (filepath) {
    /**
     * type check
     */
    if (typeof filepath !== 'string') {
        throw new Error('saveScreenshot expects a filepath from type string')
    }

    const absoluteFilepath = filepath.startsWith('/')
        ? filepath
        : path.join(process.cwd(), filepath)

    /**
     * check if directory exists
     */
    if (!fs.existsSync(path.dirname(absoluteFilepath))) {
        throw new Error(`directory (${path.dirname(absoluteFilepath)}) doesn't exist`)
    }

    const screenBuffer = await this.takeElementScreenshot(this.elementId)
    const screenshot = new Buffer(screenBuffer, 'base64')
    fs.writeFileSync(absoluteFilepath, screenshot)

    return screenshot
}
