/**
 *
 * Save a screenshot as a base64 encoded PNG with the current state of the browser. Be aware that some Selenium driver
 * are taking screenshots of the whole document (e.g. phantomjs) and others only of the current viewport. If you want
 * to always be sure that the screenshot has the size of the whole document, use [WebdriverCSS](https://github.com/webdriverio/webdrivercss)
 * to enhance this command with that functionality.
 *
 * <example>
     :saveScreenshot.js
     // receive screenshot as Buffer
     client.saveScreenshot(function(err, screenshot, response) { ... });
     // save screenshot to file and receive as Buffer
     client.saveScreenshot('./snapshot.png', function(err, screenshot, response) { ... });
     // save screenshot to file
     client.saveScreenshot('./snapshot.png');
 * </example>
 *
 * @param {Function|String=}   filename    path to the generated image (relative to the execution directory)
 *
 * @uses protocol/screenshot
 * @type utility
 *
 */

var Q = require('q'),
    fs = require('fs');

module.exports = function saveScreenshot(filename) {

    return this.screenshot().then(function(res) {
        var screenshot = new Buffer(res.value, 'base64');

        if (typeof filename === 'string') {
            return Q.nfcall(fs.writeFile, filename, screenshot);
        }

        return screenshot;
    });

};