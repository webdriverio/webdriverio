/**
 *
 * Retrieve a list of all window handles available in the session.
 *
 * @returns {String[]} a list of window handles
 * @callbackParameter error, windowHandles
 * @uses protocol/windowHandles
 * @type window
 *
 */

module.exports = function getTabIds () {
    return this.unify(this.windowHandles(), {
        extractValue: true
    });
};