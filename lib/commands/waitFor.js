/**
 *
 * Wait for an object in the DOM (selected by given selector) for the provided amount of
 * milliseconds. The callback is called with false if the object isn't found.
 *
 * @param {String} selector element to wait for
 * @param {Number} ms       time in ms
 * @callbackParameter error
 *
 * @uses protocol/timeoutsImplicitWait, protocol/element
 * @type utility
 *
 */

module.exports = function waitFor (selector, ms) {

    /*!
     * ensure that ms is set properly
     */
    if(typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    return this.timeoutsImplicitWait(ms).element(selector).then(function() {
        return this.timeoutsImplicitWait(0);
    });

};