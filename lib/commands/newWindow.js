/**
 *
 * Open new window in browser. This command is the equivalent function to window.open().
 *
 * @param {String} url            website URL to open
 * @param {String} windowName     name of the new window
 * @param {String} windowFeatures features of opened window (e.g. size, position, scrollbars, etc.)
 *
 * @uses protocol/execute, window/getTabIds, window/switchTab
 *
 */

/* global window */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function newWindow (url, windowName, windowFeatures) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * reorder parameters
     */
    if(typeof windowName === 'function') {
        callback = windowName;
        windowName = '';
        windowFeatures = '';
    } else if(typeof windowFeatures === 'function') {
        callback = windowFeatures;
        windowFeatures = '';
    }

    /*!
     * parameter check
     */
    if(typeof url !== 'string' || typeof windowName !== 'string' || typeof windowFeatures !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with newWindow command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            /* istanbul ignore next: window */
            self.execute(function(url, windowName, windowFeatures) {
                return window.open(url, windowName, windowFeatures);
            }, [url, windowName, windowFeatures], cb);
        },
        function(res, cb) {
            response.execute = res;
            self.getTabIds(cb);
        },
        function(res, cb) {
            response.getTabIds = res;
            self.switchTab(res[res.length-1], cb);
        },
        function(res, cb) {
            response.switchTab = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};