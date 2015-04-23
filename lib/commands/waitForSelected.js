/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (un)selected. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is (un)selected.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @callbackParameter error, isSelected
 *
 * @uses action/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

var isSelectedFunc = require('../helpers/_isSelected');

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

    return this.timeoutsAsyncScript(ms).selectorExecuteAsync(selector, isSelectedFunc, reverse);

};