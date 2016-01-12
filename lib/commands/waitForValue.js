var ErrorHandler = require('../utils/ErrorHandler.js');
/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to have a value. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element has a value.
 *
 * @param {String}   selector element to wait
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses protocol/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

module.exports = function waitForValue(selector, ms, reverse) {

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
        return this.getValue(selector).then(function(value) {

            if(Array.isArray(value)) {
                var result = reverse;
                for(var i = 0; i < value.length; ++i) {
                    if(!reverse) {
                        result = result || value[i] !== '';
                    } else {
                        result = result && value[i] === '';
                    }
                }

                return result !== reverse;
            }

            return (value !== '') !== reverse;
        });
    }, ms).catch(function(err) {
        if(ErrorHandler.isTimeoutError(err)) {
            throw new Error('element (' + selector + ') still ' + (reverse ? 'with' : 'without') + ' a value after ' + ms + 'ms');
        } else {
            throw err;
        }
    });

};
