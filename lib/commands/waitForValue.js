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
 * @callbackParameter error, hasValue
 *
 * @uses protocol/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

var hasValueFunc = require('../helpers/_hasValue');

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

    return this.timeoutsAsyncScript(ms).selectorExecuteAsync(selector, hasValueFunc, reverse);

};
