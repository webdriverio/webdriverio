/**
 *
 * Wait for an object in the DOM (selected by given selector) for the provided amount of
 * milliseconds. The callback is called with false if the object isnt found.
 *
 * @param {String} selector element to wait for
 * @param {Number} ms       time in ms
 *
 * @uses protocol/implicitWait, protocol/element
 * @type utility
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function waitFor (selector, ms) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with waitFor command'));
    }

    /*!
     * ensure that ms is set properly
     */
    if(typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    var self = this,
        response = {
            implicitWait: []
        };

    async.waterfall([
        function(cb) {
            self.implicitWait(ms, cb);
        },
        function(res, cb) {
            response.implicitWait.push(res);
            self.element(selector, cb);
        },
        function(res, cb) {
            response.element = res;
            self.implicitWait(0, cb);
        },
        function(res, cb) {
            response.implicitWait.push(res);
            cb();
        }
    ], function(err) {

        callback(err,null,response);

    });

};