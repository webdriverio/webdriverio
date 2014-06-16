/**
 * check if element is selected
 *
 * @param {String}  selector  CSS selector of desired element
 * @param {Boolean} reverse   if true, function waits until element is unselected
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

            if ((!reverse && typeof elem.selected === 'boolean' && elem.selected) ||
                ( reverse && typeof elem.selected === 'boolean' && !elem.selected)) {
                window.clearInterval(interval);
                return cb(true);
            }
        }
    }, 100);
};