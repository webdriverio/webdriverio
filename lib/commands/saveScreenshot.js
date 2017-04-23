/**
 *
 * Save a screenshot as a base64 encoded PNG with the current state of the browser. Be aware that some Selenium driver
 * are taking screenshots of the whole document (e.g. phantomjs) and others only of the current viewport. If you want
 * to always be sure that the screenshot has the size of the whole document, use [wdio-screenshot](https://www.npmjs.com/package/wdio-screenshot)
 * to enhance this command with that functionality.
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser view', function () {
        // receive screenshot as Buffer
        var screenshot = browser.saveScreenshot(); // returns base64 string buffer
        fs.writeFileSync('./myShort.png', screenshot)

        // save screenshot to file and receive as Buffer
        screenshot = browser.saveScreenshot('./snapshot.png');

        // save screenshot to file
        browser.saveScreenshot('./snapshot.png');
    });
 * </example>
 *
 * @alias browser.saveScreenshot
 * @param {Function|String=}   filename    path to the generated image (relative to the execution directory)
 * @uses protocol/screenshot
 * @type utility
 *
 */

import fs from 'fs'
import { Buffer } from 'safe-buffer'

import { RuntimeError } from '../utils/ErrorHandler'

let saveScreenshot = function (selector, filename) {
    const handleScreenshot = (result) => {
        this.emit('screenshot', {data: result.value, filename})

        let screenshot = new Buffer(result.value, 'base64')

        if (typeof filename === 'string') {
            fs.writeFileSync(filename, screenshot)
        }

        return screenshot
    }

    if (typeof selector === 'string' || typeof this.lastResult.selector === 'string') {
        return this.element(selector).then((elem) => {
            /**
             * check if element was found and throw error if not
             */
            if (!elem.value) {
                throw new RuntimeError(7)
            }

            return this.elementIdScreenshot(elem.value.ELEMENT).then(handleScreenshot)
        })
    }

    return this.screenshot().then(handleScreenshot)
}

export default saveScreenshot
