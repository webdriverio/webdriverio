/**
 *
 * End the session and close browser.
 *
 * @uses protocol/session
 * @type utility
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