/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be present within the DOM. Returns true if the selector
 * matches at least one element. If the reverse flag is true, the command will
 * instead return true if the selector does not match any elements.
 *
 * @param {String}   selector CSS selector to query
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it instead waits for the selector to not match any elements (default: false)
 * @callbackParameter error, isExisting
 *
 * @type utility
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js'),
    start = 0;

module.exports = function waitForExist(selector, ms, reverse) {

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    if (typeof reverse !== 'boolean') {
        reverse = false;
    }

    start = start ? start : new Date().getTime();

    return this.pause(250).elements(selector).then(function(res) {

        /**
         * element was found, resolving with true
         */
        res = res && res.value || [];
        if ((!reverse && res.length) || (reverse && !res.length)) {
            start = 0;
            return true;
        }

        /**
         * element wasn't found after giving time, throwing an error
         */
        var now = new Date().getTime();
        if(now - start > ms) {
            start = 0;
            throw new ErrorHandler(reverse ? 100 : 7);
        }

        /**
         * repeat until element was found or time is up
         */
        return this.waitForExist(selector, ms, reverse);

    });

};
