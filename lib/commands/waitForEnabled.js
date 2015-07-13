/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (dis/en)abled. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is (dis/en)abled.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses action/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

module.exports = function waitForEnabled(selector, ms, reverse) {

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
        return this.isEnabled(selector).then(function(isEnabled) {

            if(Array.isArray(isEnabled)) {
                var result = reverse;
                for(var i = 0; i < isEnabled.length; ++i) {
                    if(!reverse) {
                        result = result || isEnabled[i];
                    } else {
                        result = result && isEnabled[i];
                    }
                }

                return result !== reverse;
            }

            return isEnabled !== reverse;
        });
    }, ms).catch(function() {
        throw new Error('element (' + selector + ') still ' + (reverse ? '' : 'not') + ' enabled after ' + ms + 'ms');
    });

};