/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (un)checked. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is (un)checked.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @callbackParameter error, isChecked
 *
 * @uses action/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

var isCheckedFunc = require('../helpers/_isChecked');

module.exports = function waitForChecked(selector, ms, reverse) {

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    if (typeof reverse !== 'boolean') {
        reverse = false;
    }

    return this.timeoutsAsyncScript(ms).selectorExecuteAsync(selector, isCheckedFunc, reverse);

};