/**
 *
 * Get the value of a `<textarea>` or text `<input>` found by css selector.
 *
 * @param {String} selector input or textarea element
 * @returns {String}        requested input value
 *
 * @uses protocol/elements, protocol/elementIdAttribute
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getValue (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getValue command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdAttribute = [];

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdAttribute(val.ELEMENT, 'value', function(err,res) {
                    response.elementIdAttribute.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdAttribute && response.elementIdAttribute.length === 1) {

            value = response.elementIdAttribute[0].value;

        } else if(response.elementIdAttribute && response.elementIdAttribute.length > 1) {

            value = response.elementIdAttribute.map(function(res) {
                return res.value;
            });

        }

        callback(err, value, response);

    });

};