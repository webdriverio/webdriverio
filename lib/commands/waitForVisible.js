/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (in)visible. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is visible.
 *
 * This function checks for visibility using window.getComputedStyle. An
 * element will be considered invisible if its visibility is 'none', its
 * display is 'hidden', its opacity is 0 or its x/y coordinates are not
 * within the viewport.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @callbackParameter error, isVisible
 *
 * @uses protocol/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

var isVisibleFunc = require('../helpers/_isVisible.js'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function waitForVisible(selector, ms, reverse) {

    /*!
     * parameter check
     */
    if (typeof selector !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with waitForVisible command');
    }

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    if (typeof reverse !== 'boolean') {
        reverse = false;
    }

    var self = this;

        return self.timeoutsAsyncScript(ms)
            .selectorExecuteAsync(selector, isVisibleFunc, reverse)
            .then(function(res){
                console.log(res);
                return res;
            });
};
