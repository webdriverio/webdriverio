/**
 * helper function to get the viewport size of the browser
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var getViewportSize = function getViewportSize() {
    return {
        screenWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        screenHeight: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    };
};

exports["default"] = getViewportSize;
module.exports = exports["default"];
