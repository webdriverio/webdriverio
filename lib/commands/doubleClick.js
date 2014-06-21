/**
 *
 * Double-click on an element based on given selector.
 *
 * @param {String} selector element to double click on. If it matches with more than on DOM-element it automatically clicks on the first element
 *
 * @uses protocol/element, protocol/moveTo, protocol/doDoubleClick, protocol/touchDoubleClick
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function doubleClick (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with doubleClick command'));
    }

    var self = this,
        response = {};

    if(this.isMobile) {

        async.waterfall([
            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;
                self.touchDoubleClick(res.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.touchDoubleClick = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    } else {

        async.waterfall([
            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;
                self.moveTo(res.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.moveTo = res;
                self.doDoubleClick(cb);
            },
            function(res, cb) {
                response.doDoubleClick = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};