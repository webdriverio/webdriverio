/**
 *
 * End the session and close browser.
 *
 * <example>
    :end.js
    client
        .init() // starts session and opens the browser
        .url('http://google.com')
        // ... other commands
        .end(); // ends session and close browser
 * </example>
 *
 * @callbackParameter error
 * @uses protocol/session
 * @type utility
 *
 */

module.exports = function end () {
    return this.session('delete');
};