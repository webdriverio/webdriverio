/**
 *
 * Close current window (and focus on an other window). If no window handle is given
 * it automatically switches back to the first handle.
 *
 * <example>
    :close-async.js
    client
        .url('http://github.com')
        .newWindow('http://google.com')
        .getTitle().then(function(title) {
            console.log(title); // outputs: "Google"
        })
        .close()
        .getTitle().then(function(title) {
            console.log(title); // outputs: "GitHub · Build software better, together."
        });

    :close-sync.js
    it('should demonstrate the close command', function () {
        browser
            .url('http://github.com')
            .newWindow('http://google.com')

        var title = browser.getTitle();
        console.log(title); // outputs: "Google"

        browser.close()

        title = browser.getTitle();
        console.log(title); // outputs: "GitHub · Build software better, together."
    });
 * </example>
 *
 * @param {String=} windowHandle new window to focus on
 *
 * @uses protocol/window, window/switchTab
 * @type window
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var close = function close(windowHandle) {
    var _this = this;

    if (typeof windowHandle !== 'string') {
        return this.getTabIds().then(function (tabIds) {
            if (tabIds.length === 0) {
                throw new _utilsErrorHandler.RuntimeError('' + 'Can\'t switch to the next tab because all windows are closed. ' + 'Make sure you keep at least one window open!');
            }

            return _this.window().switchTab(tabIds[0]);
        });
    }

    return this.window().switchTab(windowHandle);
};

exports['default'] = close;
module.exports = exports['default'];
