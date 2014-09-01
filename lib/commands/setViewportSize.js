/**
 *
 * This command changes the viewport size of the browser. When talking about browser size we have to differentiate
 * between the actual window size of the browser application and the document/viewport size of the website. The
 * window size will always be bigger since it includes the height of any menu or status bars.
 *
 * <example>
    :setViewportSize.js
    client
        .setViewportSize({
            width: 500,
            height: 500
        })
        .windowHandleSize(function(err, res) {
            console.log(res.value); // outputs: "{ width: 500, height: 602 }"
        })
 * </example>
 *
 * @param {Object}   size  window width/height
 * @param {Boolean}  type  set to `false` to change window size, `true` (default) to change viewport size
 *
 * @uses protocol/execute, protocol/windowHandleSize
 * @type window
 *
 */


var async = require('async'),
    getViewportSizeHelper = require('../helpers/_getViewportSize')
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setViewportSize (size) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof size !== 'object' || typeof size.width !== 'number' || typeof size.height !== 'number') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with setViewportSize command'));
    }

    var self = this,
        response = {},
        maxExecutionTime = 5;

    /**
     * to set viewport size properly we need to execute the process multiple times
     * since the difference between the inner and outer size changes when browser
     * switch between fullscreen modes or visibility of scrollbar
     */
    function repeater(size) {
        /**
         * change viewport size of window
         */
        async.waterfall([
            /**
             * get window size
             */
            function(cb) {
                return self.windowHandleSize(cb);
            },
            /**
             * get viewport size
             */
            function(res, cb) {
                response.windowHandleSize = [res];
                self.execute(getViewportSizeHelper, cb);
            },
            /**
             * change window size
             */
            function(res, cb) {
                response.execute = res;

                var widthDiff = response.windowHandleSize[0].value.width - response.execute.value.screenWidth,
                    heightDiff = response.windowHandleSize[0].value.height - response.execute.value.screenHeight;

                self.windowHandleSize({
                    width: size.width + widthDiff,
                    height: size.height + heightDiff
                }, cb)
            },
            function(res, cb) {
                response.windowHandleSize.push(res);
                self.execute(getViewportSizeHelper, cb);
            }
        ], function(err, res) {

            /**
             * if viewport size not equals desired size, execute process again
             */
            if(!err && --maxExecutionTime && (res.value.screenWidth !== size.width || res.value.screenHeight !== size.height)) {
                return repeater(size);
            }

            return callback(err,null,response);
        });
    }

    repeater(size);

};