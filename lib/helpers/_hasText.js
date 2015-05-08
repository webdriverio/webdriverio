/**
 * check if element has text/content
 *
 * @param {String}  elements  DOM elements to check against
 * @param {Boolean} reverse   if true, function waits until element has no text
 *
 * @see  waitForVisible
 */

module.exports = function(elements, reverse) {

    if(elements.length === 0) {
        throw new Error('NoSuchElement');
    }

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