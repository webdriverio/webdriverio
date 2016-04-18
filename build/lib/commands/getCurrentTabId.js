/**
 *
 * Retrieve the current window handle.
 *
 * <example>
    :getCurrenteTabId.js
    client
        .url('http://webdriver.io')
        .getCurrentTabId().then(function(tabid) {
            console.log(tabid);
            // outputs something like the following:
            // "CDwindow-C43FB686-949D-4232-828B-583398FBD0C0"
        });
 * </example>
 *
 * @returns {String} the window handle URL of the current focused window
 * @uses protocol/windowHandle
 * @type window
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var getCurrentTabId = function getCurrentTabId() {
    return this.unify(this.windowHandle(), {
        extractValue: true
    });
};

exports["default"] = getCurrentTabId;
module.exports = exports["default"];
