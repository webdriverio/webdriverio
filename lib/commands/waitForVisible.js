var ErrorHandler = require('../utils/ErrorHandler.js');
/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (in)visible. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is visible.
 *
 * This function checks for visibility using window.getComputedStyle. An
 * element will be considered invisible if its visibility is 'hidden', its
 * display is 'none', its opacity is 0 or its x/y coordinates are not
 * within the viewport.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses protocol/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

module.exports = function waitForVisible(selector, ms, reverse) {

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
        return this.isVisible(selector).then(function(isVisible) {

            if(Array.isArray(isVisible)) {
                var result = reverse;
                for(var i = 0; i < isVisible.length; ++i) {
                    if(!reverse) {
                        result = result || isVisible[i];
                    } else {
                        result = result && isVisible[i];
                    }
                }

                return result !== reverse;
            }

            return isVisible !== reverse;
        });
    }, ms).catch(function(err) {
        if(ErrorHandler.isTimeoutError(err)) {
            throw new Error('element (' + selector + ') still ' + (reverse ? '' : 'not') + ' visible after ' + ms + 'ms');
        } else {
            throw err;
        }
    });

};
