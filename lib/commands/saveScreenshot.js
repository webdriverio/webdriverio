/**
 *
 * Save a screenshot as a base64 encoded PNG with the current state of the browser. Be aware that some Selenium driver
 * are taking screenshots of the whole document (e.g. phantomjs) and others only of the current viewport. If you want
 * to always be sure that the screenshot has the size of the whole document, use [WebdriverCSS](https://github.com/webdriverio/webdrivercss)
 * to enhance this command with that functionality.
 *
 * <example>
    :saveScreenshotSync.js
    // receive screenshot as Buffer
    var screenshot = browser.saveScreenshot(); // returns base64 string buffer
    fs.writeFileSync('./myShort.png', screenshot)

    // save screenshot to file and receive as Buffer
    screenshot = browser.saveScreenshot('./snapshot.png');

    // save screenshot to file
    browser.saveScreenshot('./snapshot.png');
 * </example>
 *
 * @param {Function|String=}   filename    path to the generated image (relative to the execution directory)
 *
 * @uses protocol/screenshot
 * @type utility
 *
 */

import fs from 'fs'

let saveScreenshot = function (filename) {
    return this.screenshot().then((res) => {
        this.emit('screenshot', {data: res.value, filename})

        let screenshot = new Buffer(res.value, 'base64')

        if (typeof filename === 'string') {
            fs.writeFileSync(filename, screenshot)
        }

        return screenshot
    })
}

export default saveScreenshot
