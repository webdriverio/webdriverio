/**
 *
 * Switch focus to a particular tab / window handle.
 *
 * @param {String=} windowHandle window handle URL to focus on (if no handle was specified the command switches to the first available one)
 *
 * @uses protocol/window, window/getTabIds, window/switchTab
 * @type window
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var switchTab = function switchTab(windowHandle) {
    var _this = this;

    /*!
     * parameter check
     */
    if (typeof windowHandle !== 'string') {
        windowHandle = null;
    }

    if (windowHandle) {
        return this.window(windowHandle);
    }

    return this.windowHandles().then(function (tabIds) {
        if (tabIds && tabIds.value && tabIds.value.length) {
            return _this.switchTab(tabIds.value[0]);
        }
    });
};

exports['default'] = switchTab;
module.exports = exports['default'];
