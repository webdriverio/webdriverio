var ErrorHandler = require('../utils/ErrorHandler.js');
/**
 *
 * Wait for an option or radio/checkbox element (selected by css selector) for the provided amount of
 * milliseconds to be (un)selected or (un)checked. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one element is (un)selected.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses action/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

module.exports = function waitForSelected(selector, ms, reverse) {

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    if (typeof reverse !== 'boolean') {
        reverse = false;
    }

    return this.waitUntil(function() {
        return this.isSelected(selector).then(function(isSelected) {

            if(Array.isArray(isSelected)) {
                var result = reverse;
                for(var i = 0; i < isSelected.length; ++i) {
                    if(!reverse) {
                        result = result || isSelected[i];
                    } else {
                        result = result && isSelected[i];
                    }
                }

                return result !== reverse;
            }

            return isSelected !== reverse;
        });
    }, ms).catch(function(err) {
        if(ErrorHandler.isTimeoutError(err)) {
            throw new Error('element (' + selector + ') still ' + (reverse ? '' : 'not') + ' selected after ' + ms + 'ms');
        } else {
            throw err;
        }
    });

};
