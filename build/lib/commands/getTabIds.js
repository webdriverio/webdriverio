/**
 *
 * Retrieve a list of all window handles available in the session.
 *
 * @returns {String[]} a list of window handles
 * @uses protocol/windowHandles
 * @type window
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var getTabIds = function getTabIds() {
    return this.unify(this.windowHandles(), {
        extractValue: true
    });
};

exports["default"] = getTabIds;
module.exports = exports["default"];
