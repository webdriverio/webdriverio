/**
 *
 * Submits a form found by given selector. The submit command may also be applied
 * to any element that is a descendant of a `<form>` element.
 *
 * <example>
    :index.html
    <form action="/form.php" method="post" id="loginForm">
        <label for="username">User:</label>
        <input type="text" name="username" id="username">
        <label for="password">Password:</label>
        <input type="password" name="password" id="password">
        <input type="submit" value="Login">
    </form>

    :submitForm.js
    client.submitForm('#loginForm');
 * </example>
 *
 * @param {String} selector form element
 * @uses protocol/element, protocol/submit
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function submitForm (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with submitForm command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.submit(res.value.ELEMENT, cb);
        },
        function(res, cb) {
            response.submit = res;
            cb();
        }
    ], function(err) {

        callback(err,null,response);

    });

};