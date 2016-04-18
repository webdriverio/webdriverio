/**
 *
 * Return true if the selected DOM-element found by given selector is visible. Returns an array if multiple DOM-elements are found for the given selector.
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>

    :isVisibleAsync.js
    client
        .isVisible('#notDisplayed').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notVisible').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notExisting').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notInViewport').then(function(isVisible) {
            console.log(isVisible); // outputs: true!!!
        })
        .isVisible('#zeroOpacity').then(function(isVisible) {
            console.log(isVisible); // outputs: true!!!
        });
 * </example>
 *
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* [is|are] visible
 *
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */

"use strict";

var _getIterator = require("babel-runtime/core-js/get-iterator")["default"];

Object.defineProperty(exports, "__esModule", {
    value: true
});
var isVisible = function isVisible(selector) {
    var _this = this;

    return this.elements(selector).then(function (res) {
        /**
         * if element does not exist it is automatically not visible ;-)
         */
        if (!res.value || res.value.length === 0) {
            return false;
        }

        var elementIdDisplayedCommands = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdDisplayedCommands.push(_this.elementIdDisplayed(elem.ELEMENT));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator["return"]) {
                    _iterator["return"]();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return _this.unify(elementIdDisplayedCommands, {
            extractValue: true
        });
    });
};

exports["default"] = isVisible;
module.exports = exports["default"];
