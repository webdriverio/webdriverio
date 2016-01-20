/**
 * check if element is visible and within the viewport
 *
 * @param {String}  elements  DOM elements to check against
 *
 * @see  waitForVisible
 */

let isWithinViewport = function (elements) {
    var db = document.body,
        dde = document.documentElement,
        result = [];

    if(elements.length === 0) {
        throw new Error('NoSuchElement');
    }

    for (var i = 0; i < elements.length; ++i) {
        var elem = elements[i],
            isWithinViewport = true;

        while (elem.parentNode && elem.parentNode.getBoundingClientRect) {

            var elemDimension = elem.getBoundingClientRect(),
                elemComputedStyle = window.getComputedStyle(elem),
                viewportDimension = {
                    width: Math.max(dde.clientWidth || 0, window.innerWidth || 0),
                    height: Math.max(dde.clientHeight || 0, window.innerHeight || 0)
                };

            isWithinViewport = isWithinViewport &&
                               (elemComputedStyle.display !== 'none' &&
                                elemComputedStyle.visibility === 'visible' &&
                                parseFloat(elemComputedStyle.opacity, 10) > 0 &&
                                elemDimension.bottom >= 0 &&
                                elemDimension.top <= viewportDimension.height &&
                                elemDimension.right >= 0 &&
                                elemDimension.left <= viewportDimension.width);

            elem = elem.parentNode;

        }
        result.push(isWithinViewport);
    }
    return result;
}

export default isWithinViewport
