/**
 *
 * Switch focus to a particular tab / window handle.
 *
 * @param {String=} windowHandle window handle URL to focus on (if no handle was specified the command switches to the first available one)
 * @uses protocol/window, window/getTabIds, window/switchTab
 * @type window
 *
 */

var async = require('async');

module.exports = function switchTab (windowHandle) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof windowHandle !== 'string') {
        windowHandle = null;
    }

    var self = this,
        response = {};

    if(windowHandle) {

        async.waterfall([
            function(cb) {
                self.window(windowHandle, cb);
            },
            function(res, cb) {
                response.window = res;
                cb();
            }
        ], function(err) {

            callback(err,null,response);

        });

    } else {

        async.waterfall([
            function(cb) {
                self.getTabIds(cb);
            },
            function(tabId, res, cb) {
                response.getTabIds = res;

                if(tabId && tabId.length) {
                    self.switchTab(tabId[0], cb);
                } else {
                    cb();
                }

            },
            function(obsolete, res) {

                if(res) {
                    response.switchTab = res;
                }

                arguments[arguments.length - 1]();
            }
        ], function(err) {

            callback(err,null,response);

        });

    }

};