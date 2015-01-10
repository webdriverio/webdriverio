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

var async = require('async'),
    fs = require('fs'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function saveScreenshot(filename) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof filename !== 'function' && typeof filename !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with saveScreenshot command'));
    }

    var self = this,
        response = {},
        screenshot = null;

    async.waterfall([
        function(cb) {
            self.screenshot(cb);
        },
        function(res, cb) {
            response.screenshot = res;
            screenshot = new Buffer(res.value, 'base64');

            if (typeof filename === 'string') {
                fs.writeFile(filename, screenshot, cb);
            } else {
                cb();
            }
        }
    ], function(err) {
        callback(err, screenshot, response);
    });

};