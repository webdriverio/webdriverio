/**
 *
 * Send a sequence of key strokes to an element (clears value before). You can also use
 * unicode characters like Left arrow or Back space. You’ll find all supported characters
 * [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value).
 * To do that, the value has to correspond to a key from the table.
 *
 * <example>
    :setValue.js
    client
        .setValue('.input', 'test123')
        .getValue('.input', function(err, value) {
            assert(err === null);
            assert(value === 'test123'); // true
        });
 * </example>
 *
 * @param {String}  selector   Input element
 * @param {String|Number=} values     Input element
 *
 * @uses protocol/elements, protocol/elementIdClear, protocol/elementIdValue
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setValue (selector, value) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof value === 'number') {
      value = '' + value
    }
    if(typeof selector !== 'string' || (typeof value !== 'string' && Object.prototype.toString.call(value) !== '[object Array]')) {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with setValue command'));
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
        },
        function(cb) {
            response.elementIdValue = [];

            async.eachSeries(response.elements.value, function(elem, seriesCallback) {
                self.elementIdValue(elem.ELEMENT, value, function(err,res) {
                    response.elementIdValue.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        callback(err,null,response);

    });

};
