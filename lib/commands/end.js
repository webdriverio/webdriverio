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
 * @uses protocol/session
 * @type utility
 *
 */

module.exports = function end () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        response = {};

    this.session('delete', function(err, res) {
        response.session = res;
        callback(err, null, response);
    });
};