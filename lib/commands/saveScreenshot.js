
/**
 *
 * Save a screenshot as a base64 encoded PNG with the current state of the browser. Be aware that some Selenium driver
 * are taking screenshots of the whole document (e.g. phantomjs) and others only of the current viewport. If you want
 * to always be sure that the screenshot has the size of the whole document, use [wdio-screenshot](https://www.npmjs.com/package/wdio-screenshot)
 * to enhance this command with that functionality.
 *
 * This command also doesn't support the [element screenshot](https://w3c.github.io/webdriver/webdriver-spec.html#take-element-screenshot)
 * feature yet as it isn't supported by most of the drivers. However the protocol command for it is available
 * to use (see [elementIdScreenshot](http://webdriver.io/api/protocol/elementIdScreenshot.html)).
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

export default function saveScreenshot (filename) {
    return this.screenshot().then((res) => {
        this.emit('screenshot', {data: res.value, filename})

        let screenshot = new Buffer(res.value, 'base64')

        if (typeof filename === 'string') {
            fs.writeFileSync(filename, screenshot)
        }

        return screenshot
    })
}
