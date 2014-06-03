/**
 * check if element is existent on page
 *
 * @param {String}  selector  CSS selector of desired element
 * @param {Boolean} reverse   if true, function waits for non existenz
 *
 * @see  waitForVisible
 */

module.exports = function(selector, reverse) {

    var cb = arguments[arguments.length - 1];
    var interval = setInterval(function() {

        /**
         * query element in every interval in case it gets inserted into
         * the DOM
         */
        var isExistent = document.querySelectorAll(selector).length > 0;

        if((!reverse && isExistent) || (reverse && !isExistent)) {
            window.clearInterval(interval);
            return cb(true);
        }

    }, 100);
};