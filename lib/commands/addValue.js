/**
 *
 * Add a value to an object found by a css selector. You can also use unicode
 * characters like Left arrow or Back space. You’ll find all supported characters
 * [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value).
 * To do that, the value has to correspond to a key from the table.
 *
 * @param {String}  selector   Input element
 * @param {String=} values     Input element
 *
 * @uses protocol/elements, protocol/elemendIdValue
 *
 * @test addValue.js test/spec/desktop/addValue/index.js
 * @test index.html test/spec/desktop/addValue/index.html
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function addValue (selector, value) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string' || (typeof value !== 'string' && Object.prototype.toString.call(value) !== '[object Array]')) {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with addValue command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdValue = [];

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdValue(val.ELEMENT, value, function(err,res) {
                    response.elementIdValue.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        callback(err, null, response);

    });

};