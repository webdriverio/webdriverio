/**
 *
 * Save a screenshot as a base64 encoded PNG with the current state of the browser.
 *
 * <example>
    :saveScreenshot.js
    client
        // set browser window size
        .windowHandleSize({width: 500, height: 500})
        .saveScreenshot('viewport.png') // make screenshot of current viewport (500x500px)
        .saveScreenshot('wholeScreen.png', true) // makes screenshot of whole document (1280x1342px)
        .end();
 * </example>
 *
 * @param {String}   fileName    path of generated image (relative to the execution directory)
 * @param {Boolean=} totalScreen if true (default value) it takes a screenshot of whole website, otherwise only of current viewport
 *
 * @uses protocol/execute, utility/scroll, protocol/screenshot
 * @type utility
 *
 */

/* global document,window */

var async = require('async'),
    fs = require('fs'),
    gm = require('gm'),
    rimraf = require('rimraf'),
    ErrorHandler = require('../utils/ErrorHandler.js');

gm.prototype.write = function(fileName, callback) {
	fs.writeFile(fileName, this.sourceBuffer, callback);
};

module.exports = function saveScreenshot(fileName, totalScreen) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof fileName !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with saveScreenshot command'));
    }

    /*!
     * set defaults
     */
    if (arguments.length === 3 && typeof totalScreen !== 'boolean') {
        totalScreen = true;
    } else if(arguments.length !== 3) {
        totalScreen = false;
    }

    var self = this,
        response = {
            execute: [],
            screenshot: []
        },
        tmpDir = __dirname + '/../../.tmp',
        cropImages = [],
        currentXPos = 0,
        currentYPos = 0,
        screenshot = null,
        scrollFn = function(w, h) {
            document.body.style.webkitTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.mozTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.msTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.oTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.transform = 'translate(-' + w + 'px, -' + h + 'px)';
        };

    /*!
     * firefoxdriver and phantomjs automaticaly takes the screenshot of the whole
     * browser dimension
     */
    if (totalScreen && this.desiredCapabilities.browserName !== 'phantomjs' && this.desiredCapabilities.browserName !== 'firefox') {

        /*!
         * total screen
         */
        async.waterfall([

            /*!
             * create tmp directory to cache viewport shots
             */
            function(cb) {
                fs.exists(tmpDir, function(exists) {
                    return exists ? cb() : fs.mkdir(tmpDir, 0755, cb);
                });
            },

            /*!
             * get viewport width/height and total width/height
             */
            function() {
                var cb = arguments[arguments.length - 1];
                self.execute(function() {
                    return {
                        screenWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                        screenHeight: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
                        documentWidth: document.documentElement.scrollWidth,
                        documentHeight: document.documentElement.scrollHeight
                    };
                }, cb);
            },

            /*!
             * scroll back to start scanning
             */
            function(res, cb) {
                response.execute.push(res);
                self.scroll(0, 0, cb);
            },

            /*!
             * take viewport shots and cache them into tmp dir
             */
            function(val, res, cb) {
                response.scroll = res;

                /*!
                 * run scan
                 */
                async.whilst(

                    /*!
                     * while expression
                     */
                    function(callback) {
                        callback(currentXPos < (response.execute[0].value.documentWidth / response.execute[0].value.screenWidth));
                    },

                    /*!
                     * loop function
                     */
                    function(finisedScreenshot) {
                        response.screenshot = [];

                        async.waterfall([

                            /*!
                             * take screenshot of viewport
                             */
                            self.screenshot.bind(self),

                            /*!
                             * cache image into tmp dir
                             */
                            function(res, cb) {
                                var file = tmpDir + '/' + currentXPos + '-' + currentYPos + '.png';
                                gm(new Buffer(res.value, 'base64')).crop(response.execute[0].value.screenWidth, response.execute[0].value.screenHeight, 0, 0).write(file, cb);
                                response.screenshot.push(res);

                                if (!cropImages[currentXPos]) {
                                    cropImages[currentXPos] = [];
                                }

                                cropImages[currentXPos][currentYPos] = file;

                                currentYPos++;
                                if (currentYPos > (response.execute[0].value.documentHeight / response.execute[0].value.screenHeight)) {
                                    currentYPos = 0;
                                    currentXPos++;
                                }
                            },

                            /*!
                             * scroll to next area
                             */
                            function() {
                                self.execute(scrollFn,
                                    currentXPos * response.execute[0].value.screenWidth,
                                    currentYPos * response.execute[0].value.screenHeight,
                                    function(val, res) {
                                        response.execute.push(res);
                                    }
                                ).pause(100).call(arguments[arguments.length - 1]);
                            }

                        ], finisedScreenshot);
                    },
                    cb
                );
            },

            /*!
             * concats all shots
             */
            function(cb) {
                var subImg = 0;

                async.eachSeries(cropImages, function(x, cb) {
                    var col = gm(x.shift());
                    col.append.apply(col, x);

                    if (!screenshot) {
                        screenshot = col;
                        col.write(fileName, cb);
                    } else {
                        col.write(tmpDir + '/' + (++subImg) + '.png', function() {
                            gm(fileName).append(tmpDir + '/' + subImg + '.png', true).write(fileName, cb);
                        });
                    }
                }, cb);
            },

            /*!
             * crop screenshot regarding page size
             */
            function() {
                gm(fileName).crop(response.execute[0].value.documentWidth, response.execute[0].value.documentHeight, 0, 0).write(fileName, arguments[arguments.length - 1]);
            },

            /*!
             * remove tmp dir
             */
            function() {
                rimraf(tmpDir, arguments[arguments.length - 1]);
            },

            /*!
             * scroll back to start position
             */
            function(cb) {
                self.execute(scrollFn, 0, 0, cb);
            }
        ], function(err) {
            callback(err, null, response);
        });

    } else {

        /*!
         * only current viewport
         */

        async.waterfall([

            /*!
             * get viewport width/height and total width/height
             */
            function() {
                var cb = arguments[arguments.length - 1];
                self.execute(function() {
                    return {
                        screenWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                        screenHeight: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
                        documentWidth: document.documentElement.scrollWidth,
                        documentHeight: document.documentElement.scrollHeight
                    };
                }, cb);
            },
            function(res, cb) {
                response.execute = res;
                self.screenshot(cb);
            },
            function(res, cb) {
                response.screenshot = res;
                gm(new Buffer(res.value, 'base64')).crop(response.execute.value.screenWidth, response.execute.value.screenHeight, 0, 0).write(fileName, cb);
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};