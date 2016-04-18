/**
 * check if element is visible and within the viewport
 *
 * @param {String}  elements  DOM elements to check against
 *
 * @see  waitForVisible
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var isWithinViewport = function isWithinViewport(elements) {
    var dde = document.documentElement;
    var result = [];

    if (elements.length === 0) {
        throw new Error('NoSuchElement');
    }

    for (var i = 0; i < elements.length; ++i) {
        var elem = elements[i];
        var isWithinViewport = true;

        while (elem.parentNode && elem.parentNode.getBoundingClientRect) {
            var elemDimension = elem.getBoundingClientRect();
            var elemComputedStyle = window.getComputedStyle(elem);
            var viewportDimension = {
                width: dde.clientWidth,
                height: dde.clientHeight
            };

            isWithinViewport = isWithinViewport && elemComputedStyle.display !== 'none' && elemComputedStyle.visibility === 'visible' && parseFloat(elemComputedStyle.opacity, 10) > 0 && elemDimension.bottom > 0 && elemDimension.right > 0 && elemDimension.top < viewportDimension.height && elemDimension.left < viewportDimension.width;

            elem = elem.parentNode;
        }
        result.push(isWithinViewport);
    }
    return result;
};

exports['default'] = isWithinViewport;
module.exports = exports['default'];
