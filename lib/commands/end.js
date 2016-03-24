/**
 *
 * End the session and close browser.
 *
 * <example>
    :endAsync.js
    client
        .init() // starts session and opens the browser
        .url('http://google.com')
        // ... other commands
        .end(); // ends session and close browser
 * </example>
 *
 * @uses protocol/session
 * @type utility
 *
 */

let end = function () {
    return this.session('delete')
}

export default end
