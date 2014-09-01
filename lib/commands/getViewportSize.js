/**
 *
 * Get viewport size of the current browser window.
 *
 * <example>
    :getSource.js
    client
        .url('http://webdriver.io')
        .getViewportSize(function(err, size) {
            console.log(size);
            // ouputs viewport size:
            // {
            //     width: 500,
            //     height: 500,
            // }
        })
        .windowHandleSize(function(err, res) {
            console.log(res);
            // outputs window size:
            // {
            //     width: 500,
            //     height: 602,
            //     hCode: 500,
            //     class: 'org.openqa.selenium.Dimension'
            // }
        });
 * </example>
 *
 * @returns {Object}  viewport width and height of the browser
 * @uses protocol/execute
 * @type window
 *
 */

var async = require('async'),
    getViewportSizeHelper = require('../helpers/_getViewportSize');

module.exports = function getViewportSize () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.execute(getViewportSizeHelper, cb);
        },
        function(res, cb) {
            response.execute = res;
            cb();
        }
    ], function(err) {

        var size = {
            width: response.execute.value.screenWidth || 0,
            height: response.execute.value.screenHeight || 0
        };

        callback(err, size, response);
    });

};