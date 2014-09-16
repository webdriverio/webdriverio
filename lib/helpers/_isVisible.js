/**
 * check if element is visible on page
 *
 * @param {String}  elements  DOM elements to check against
 * @param {Boolean} reverse   if true, function waits for invisible
 *
 * @see  waitForVisible
 */

/* global document,window */
module.exports = function(elements, reverse) {
    var cb = arguments[arguments.length - 1],
        db = document.body,
        dde = document.documentElement;

    var interval = setInterval(function() {

        for (var i = 0; i < elements.length; ++i) {
            var elem = elements[i],
                conditionFulfilled = reverse ? false : true;

            while (elem.parentNode && elem.parentNode.getBoundingClientRect) {

                var condition = false,
                    elemDimension = elem.getBoundingClientRect(),
                    elemComputedStyle = window.getComputedStyle(elem),
                    documentDimension = {
                        width: Math.max(db.scrollTop || 0, dde.scrollTop || 0, db.offsetwidth || 0, dde.offsetWidth || 0, db.clientWidth || 0, dde.clientWidth || 0),
                        height: Math.max(db.scrollheight || 0, dde.scrollHeight || 0, db.offsetHeight || 0, dde.offsetHeight || 0, db.clientHeight || 0, dde.clientHeight || 0)
                    };

                if ((!reverse &&
                    elemComputedStyle.display !== 'none' &&
                    elemComputedStyle.visibility === 'visible' &&
                    parseFloat(elemComputedStyle.opacity, 10) > 0 &&
                    elemDimension.bottom >= 0 &&
                    elemDimension.top <= documentDimension.height &&
                    elemDimension.right >= 0 &&
                    elemDimension.left <= documentDimension.width) ||

                    (reverse &&
                    (elemComputedStyle.display === 'none' ||
                    elemComputedStyle.visibility === 'hidden' ||
                    parseFloat(elemComputedStyle.opacity, 10) === 0 ||
                    elemDimension.bottom < 0 ||
                    elemDimension.top > documentDimension.height ||
                    elemDimension.right < 0 ||
                    elemDimension.left > documentDimension.width))) {

                    condition = true;

                }

                if(reverse) {
                    /**
                     * if reverse is true (waitForInvisible) the condition is fulfilled
                     * when at least one element is hidden
                     */
                    conditionFulfilled = conditionFulfilled || condition;
                } else {
                    /**
                     * if reverse is false (waitForVisible (default)) the condition is fulfilled
                     * when each element is visible
                     */
                    conditionFulfilled = conditionFulfilled && condition;
                }
                elem = elem.parentNode;

            }

            if(conditionFulfilled) {
                window.clearInterval(interval);
                return cb(true);
            }

        }

    }, 100);
};
