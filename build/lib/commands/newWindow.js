/**
 *
 * Open new window in browser. This command is the equivalent function to `window.open()`. This command does not
 * work in mobile environments.
 *
 * __Note:__ When calling this command you automatically switch to the new window.
 *
 * <example>
    :newWindowAsync.js
    client
        .url('http://google.com')
        .getTitle().then(function(title) {
            console.log(title); // outputs: "Google"
        })
        .newWindow('http://webdriver.io', 'WebdriverIO window', 'width=420,height=230,resizable,scrollbars=yes,status=1')
        .getTitle().then(function(title) {
            console.log(title);
            // outputs the following:
            // "WebdriverIO - Selenium 2.0 javascript bindings for nodejs"
        })
        .close()
        .getTitle().then(function(title) {
            console.log(title); // outputs: "Google"
        })
        .end();

    :newWindowSync.js
    it('should demonstrate the newWindow command', function () {
        browser.url('http://google.com')
        console.log(browser.getTitle()); // outputs: "Google"

        browser.newWindow('http://webdriver.io', 'WebdriverIO window', 'width=420,height=230,resizable,scrollbars=yes,status=1')
        console.log(browser.getTitle()); // outputs: "WebdriverIO - Selenium 2.0 javascript bindings for nodejs"

        browser.close()
        console.log(browser.getTitle()); // outputs: "Google"
    });
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

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _scriptsNewWindow = require('../scripts/newWindow');

var _scriptsNewWindow2 = _interopRequireDefault(_scriptsNewWindow);

var _utilsErrorHandler = require('../utils/ErrorHandler');

var newWindow = function newWindow(url) {
    var _this = this;

    var windowName = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
    var windowFeatures = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

    /*!
     * parameter check
     */
    if (typeof url !== 'string' || typeof windowName !== 'string' || typeof windowFeatures !== 'string') {
        throw new _utilsErrorHandler.CommandError('number or type of arguments don\'t agree with newWindow command');
    }

    /*!
     * mobile check
     */
    if (this.isMobile) {
        throw new _utilsErrorHandler.CommandError('newWindow command is not supported on mobile platforms');
    }

    return this.execute(_scriptsNewWindow2['default'], url, windowName, windowFeatures).getTabIds().then(function (tabs) {
        return _this.switchTab(tabs[tabs.length - 1]);
    });
};

exports['default'] = newWindow;
module.exports = exports['default'];
