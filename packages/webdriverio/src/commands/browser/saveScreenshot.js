/**
 *
 * Save a screenshot of the current browsing context to a PNG file on your OS. Be aware that
 * some browser driver take screenshots of the whole document (e.g. Geckodriver with Firefox)
 * and others only of the current viewport (e.g. Chromedriver with Chrome). If you want to
 * always be sure that the screenshot has the size of the whole document, use [wdio-screenshot](https://www.npmjs.com/package/wdio-screenshot)
 * to enhance this command with that functionality.
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser view', function () {
        browser.saveScreenshot('./some/path/screenshot.png');
    });
 * </example>
 *
 * @alias browser.saveScreenshot
 * @param   {String}  filename  path to the generated image (`.png` suffix is required) relative to the execution directory
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
    if (typeof filepath !== 'string' || !filepath.endsWith('.png')) {
        throw new Error('saveScreenshot expects a filepath of type string and ".png" file ending')
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

    const screenBuffer = await this.takeScreenshot()
    const screenshot = new Buffer(screenBuffer, 'base64')
    fs.writeFileSync(absoluteFilepath, screenshot)

    return screenshot
}
