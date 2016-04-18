/**
 *
 * pauses queue execution for a specific amount of time
 *
 * <example>
    :pauseAsync.js
    var starttime = new Date().getTime();

    client
        .pause(3000)
        .call(function() {
            var endtime = new Date().getTime();
            console.log(endtime - starttime); // outputs: 3000
        })
 * </example>
 *
 * @param {Number} milliseconds time in ms
 * @type utility
 *
 */

"use strict";

var _Promise = require("babel-runtime/core-js/promise")["default"];

Object.defineProperty(exports, "__esModule", {
    value: true
});
var pause = function pause() {
    var milliseconds = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];

    return new _Promise(function (resolve) {
        return setTimeout(resolve, milliseconds);
    });
};

exports["default"] = pause;
module.exports = exports["default"];
