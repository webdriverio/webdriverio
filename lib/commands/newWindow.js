/**
 *
 * Open new window in browser. This command is the equivalent function to `window.open()`. This command does not
 * work in mobile environments.
 *
 * __Note:__ When calling this command you automatically switch to the new window.
 *
 * <example>
    :newWindow.js
    client
        .url('http://google.com')
        .getTitle(function(err, title) {
            console.log(title); // outputs: "Google"
        })
        .newWindow('http://webdriver.io', 'WebdriverIO window', 'width=420,height=230,resizable,scrollbars=yes,status=1')
        .getTitle(function(err, title) {
            console.log(title);
            // outputs the following:
            // "WebdriverIO - Selenium 2.0 javascript bindings for nodejs"
        })
        .close()
        .getTitle(function(err, title) {
            console.log(title); // outputs: "Google"
        })
        .end();
 * </example>
 *
 * @param {String} url            website URL to open
 * @param {String} windowName     name of the new window
 * @param {String} windowFeatures features of opened window (e.g. size, position, scrollbars, etc.)
 *
 * @uses protocol/execute, window/getTabIds, window/switchTab
 * @type window
 *
 */

var async = require('async'),
    newWindowHelper = require('../helpers/_newWindow'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function newWindow(url, windowName, windowFeatures) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * reorder parameters
     */
    if (typeof windowName === 'function') {
        callback = windowName;
        windowName = '';
        windowFeatures = '';
    } else if (typeof windowFeatures === 'function') {
        callback = windowFeatures;
        windowFeatures = '';
    }

    /*!
     * parameter check
     */
    if (typeof url !== 'string' || typeof windowName !== 'string' || typeof windowFeatures !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with newWindow command'));
    }

    /*!
     * mobile check
     */
    if(this.isMobile) {
        return callback(new ErrorHandler.CommandError('newWindow command is not supported on mobile platforms'));
    }

    var self = this,
        response = {};

    async.waterfall([

        function(cb) {
            self.execute(newWindowHelper, url, windowName, windowFeatures, cb);
        },
        function(res, cb) {
            response.execute = res;
            self.getTabIds(cb);
        },
        function(tabs, res, cb) {
            response.getTabIds = res;
            self.switchTab(tabs[tabs.length - 1], cb);
        },
        function(obsolete, res, cb) {
            response.switchTab = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};