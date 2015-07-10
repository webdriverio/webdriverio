/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be present within the DOM. Returns true if the selector
 * matches at least one element that exists in the DOM. If the reverse flag
 * is true, the command will instead return true if the selector does not
 * match any elements.
 *
 * @param {String}   selector CSS selector to query
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it instead waits for the selector to not match any elements (default: false)
 *
 * @type utility
 *
 */

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

    return this.waitUntil(function() {
        return this.isExisting(selector).then(function(isExisting) {

            if(Array.isArray(isExisting)) {
                var result = reverse;
                for(var i = 0; i < isExisting.length; ++i) {
                    if(!reverse) {
                        result = result || isExisting[i];
                    } else {
                        result = result && isExisting[i];
                    }
                }

                return result !== reverse;
            }

            return isExisting !== reverse;
        });
    }, ms).catch(function() {
        throw new Error('element (' + selector + ') still ' + (reverse ? '' : 'not') + ' existing after ' + ms + 'ms');
    });

};
