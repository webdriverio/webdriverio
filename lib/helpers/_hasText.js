/**
 * check if element has text/content
 *
 * @param {String}  elements  DOM elements to check against
 * @param {Boolean} reverse   if true, function waits until element has no text
 *
 * @see  waitForVisible
 */

/* global document,window */
module.exports = function(elements, reverse) {

    var cb = arguments[arguments.length - 1];
    var interval = setInterval(function() {
        for (var i = 0; i < elements.length; ++i) {
            var elem = elements[i];

            if ((!reverse && elem.innerHTML) || (reverse && elem.innerHTML === '')) {
                window.clearInterval(interval);
                return cb(true);
            }
        }
    }, 100);
};