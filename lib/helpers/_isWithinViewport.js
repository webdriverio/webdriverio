/**
 * check if element is visible and within the viewport
 *
 * @param {String}  elements  DOM elements to check against
 *
 * @see  waitForVisible
 */

module.exports = function(elements) {
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
                documentDimension = {
                    width: Math.max(db.scrollTop || 0, dde.scrollTop || 0, db.offsetwidth || 0, dde.offsetWidth || 0, db.clientWidth || 0, dde.clientWidth || 0),
                    height: Math.max(db.scrollheight || 0, dde.scrollHeight || 0, db.offsetHeight || 0, dde.offsetHeight || 0, db.clientHeight || 0, dde.clientHeight || 0)
                };

            isWithinViewport = isWithinViewport &&
                               (elemComputedStyle.display !== 'none' &&
                                elemComputedStyle.visibility === 'visible' &&
                                parseFloat(elemComputedStyle.opacity, 10) > 0 &&
                                elemDimension.bottom >= 0 &&
                                elemDimension.top <= documentDimension.height &&
                                elemDimension.right >= 0 &&
                                elemDimension.left <= documentDimension.width);

            elem = elem.parentNode;

        }
        result.push(isWithinViewport);
    }
    return result;
};