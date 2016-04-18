/**
 *
 * Returns true if at least one element is existing by given selector
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>

    :isExistingAsync.js
    client
        .isExisting('#someRandomNonExistingElement').then(function(isExisting) {
            console.log(isExisting); // outputs: false
        })
        .isExisting('#notDisplayed').then(function(isExisting) {
            console.log(isExisting); // outputs: true
        })
        .isExisting('#notVisible').then(function(isExisting) {
            console.log(isExisting); // outputs: true
        })
        .isExisting('#notInViewport').then(function(isExisting) {
            console.log(isExisting); // outputs: true
        })
        .isExisting('#zeroOpacity').then(function(isExisting) {
            console.log(isExisting); // outputs: true
        });
 * </example>
 *
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* [is|are] existing
 *
 * @uses protocol/elements
 * @type state
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var isExisting = function isExisting(selector) {
    return this.elements(selector).then(function (res) {
        if (Array.isArray(res.value) && res.value.length > 0) {
            return true;
        }

        return false;
    });
};

exports["default"] = isExisting;
module.exports = exports["default"];
