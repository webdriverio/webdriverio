/**
 * check if element (input || textarea) has a value
 *
 * @param {String}  elements  DOM elements to check against
 * @param {Boolean} reverse   if true, function waits until element has no value
 *
 * @see  waitForVisible
 */

/* global document,window */
module.exports = function(elements, reverse) {

    var cb = arguments[arguments.length - 1];
    var interval = setInterval(function() {
        for (var i = 0; i < elements.length; ++i) {
            var elem = elements[i];

            if ((!reverse && elem.value) || (reverse && (typeof elem.value === 'undefined' || elem.value === ''))) {
                window.clearInterval(interval);
                return cb(true);
            }
        }
    }, 100);
};