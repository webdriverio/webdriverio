/**
 *
 * Retrieve the current window handle.
 *
 * @callbackParameter error, windowHandle
 * @returns {String} the window handle URL of the current focused window
 * @uses protocol/windowHandle
 * @type window
 *
 */

module.exports = function getCurrentTabId () {
    return this.unify(this.windowHandle(), {
        extractValue: true
    });
};