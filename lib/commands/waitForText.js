var ErrorHandler = require('../utils/ErrorHandler.js');
/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to have text/content. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element has text/content.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses action/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

module.exports = function waitForText(selector, ms, reverse) {

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
        return this.getText(selector).then(function(text) {

            if(Array.isArray(text)) {
                var result = reverse;
                for(var i = 0; i < text.length; ++i) {
                    if(!reverse) {
                        result = result || text[i] !== '';
                    } else {
                        result = result && text[i] === '';
                    }
                }

                return result !== reverse;
            }

            return (text !== '') !== reverse;
        });
    }, ms).catch(function(err) {
        if(ErrorHandler.isTimeoutError(err)) {
            throw new Error('element (' + selector + ') still ' + (reverse ? 'with' : 'without') + ' text after ' + ms + 'ms');
        } else {
            throw err;
        }
    });
};
