/**
 *
 * Save a screenshot as a base64 encoded PNG with the current state of the browser.
 *
 * @param {String}  fileName    path of generated image (relative to the execution directory)
 * @param {Boolean} totalScreen if true (default value) it takes a screenshot of whole website, otherwise only of current viewport
 *
 * @uses protocol/execute, utilities/scroll, protocol/screenshot
 *
 */

var async = require('async'),
    fs = require('fs'),
    gm = require('gm'),
    rimraf = require('rimraf'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function saveScreenshot (fileName, totalScreen) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof fileName !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with saveScreenshot command'));
    }

    /*!
     * set defaults
     */
    if(typeof totalScreen !== 'boolean') {
        totalScreen = true;
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
        scrollFn = function(w,h) {
            document.body.style.webkitTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.mozTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.msTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.oTransform = 'translate(-' + w + 'px, -' + h + 'px)';
            document.body.style.transform = 'translate(-' + w + 'px, -' + h + 'px)';
        };

    if(totalScreen && this.desiredCapabilities.browserName !== 'phantomjs') {

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
                    function (callback) {
                        return currentXPos < (response.execute.value.documentWidth / response.execute.value.screenWidth);
                    },

                    /*!
                     * loop function
                     */
                    function (finisedScreenshot) {
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
                                gm(new Buffer(res.value, 'base64')).write(file, cb);
                                response.screenshot.push(res);

                                if(!cropImages[currentXPos]) {
                                    cropImages[currentXPos] = [];
                                }

                                cropImages[currentXPos][currentYPos] = file;

                                currentYPos++;
                                if(currentYPos > (response.execute.value.documentHeight / response.execute.value.screenHeight)) {
                                    currentYPos = 0;
                                    currentXPos++;
                                }
                            },

                            /*!
                             * scroll to next area
                             */
                            function() {
                                self.execute(scrollFn, [
                                    currentXPos * response.execute.value.screenWidth,
                                    currentYPos * response.execute.value.screenHeight
                                ]).pause(100).call(arguments[arguments.length - 1]);
                            },

                            /*!
                             * save response
                             */
                            function(res,cb) {
                                response.execute.push(res);
                                cb();
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

                async.eachSeries(cropImages, function(x,cb) {
                    var col = gm(x.shift());
                    col.append.apply(col,x);

                    if(!screenshot) {
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
            function(cb) {
                gm(fileName).crop(response.execute.value.documentWidth, response.execute.value.documentHeight, 0, 0).write(fileName, arguments[arguments.length - 1]);
            },

            /*!
             * remove tmp dir
             */
            function(cb) {
                rimraf(tmpDir, arguments[arguments.length - 1]);
            },

            /*!
             * scroll back to start position
             */
            function(cb) {
                self.execute(scrollFn, [0,0], cb);
            }
        ], function(err) {
            callback(err, null, response);
        });

    } else {

        /*!
         * only current viewport
         */

        async.waterfall([
            function(cb) {
                self.screenshot(cb);
            },
            function(res, cb) {
                response.screenshot = res;
                fs.writeFile(fileName, res.value, 'base64', cb);
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};