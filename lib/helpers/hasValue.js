/**
 * check if element (input || textarea) has a value
 *
 * @param {String}  selector  CSS selector of desired element
 * @param {Boolean} reverse   if true, function waits until element has no value
 *
 * @see  waitForVisible
 */

/* global document,window */
module.exports = function(selector, reverse) {

    var cb = arguments[arguments.length - 1];
    var interval = setInterval(function() {

        /**
         * query element in every interval in case it gets inserted into
         * the DOM
         */
        var elements = document.querySelectorAll(selector);

        for (var i = 0; i < elements.length; ++i) {
            var elem = elements[i];

            if ((!reverse && elem.value) || (reverse && (typeof elem.value === 'undefined' || elem.value === ''))) {
                window.clearInterval(interval);
                return cb(true);
            }
        }
    }, 100);
};