/**
 *
 * Close current window (and focus on an other window).
 *
 * <example>
    :close.js
    client
        .url('http://github.com')
        .newWindow('http://google.com')
        .getTitle().then(function(title) {
            console.log(title); // outputs: "Google"
        })
        .close()
        .getTitle().then(function(title) {
            console.log(title); // outputs: "GitHub · Build software better, together."
        });
 * </example>
 *
 * @param {String=} windowHandle new window to focus on
 *
 * @uses protocol/window, window/switchTab
 * @type window
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function close (windowHandle) {

    /*!
     * parameter check
     */
    if(windowHandle && typeof windowHandle !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with close command');
    }

    return this.window().switchTab(windowHandle);
};