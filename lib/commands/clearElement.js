/**
 *
 * Clear a `<textarea>` or text `<input>` element’s value.
 *
 * <example>
    :clearElement.js
    client
        .setValue('.input', 'test123')
        .clearElement('.input')
        .getValue('.input', function(err, value) {
            assert(err === null);
            assert(value === ''); // true
        });
 * </example>
 *
 * @param {String} selector input element
 *
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function clearElement (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with clearElement command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdClear = [];

            if(res.value.length === 0) {
                // throw NoSuchElement error if no element was found
                return callback(new ErrorHandler(7));
            }

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdClear(val.ELEMENT, function(err,res) {
                    response.elementIdClear.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        callback(err, null, response);

    });

};