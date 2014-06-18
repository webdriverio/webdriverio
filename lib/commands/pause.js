/**
 *
 * pauses queue execution for a specific amount of time
 *
 * @param {Number} milliseconds time in ms
 * @type utility
 *
 */

module.exports = function pause (milliseconds, callback) {
    setTimeout(callback, milliseconds);
};