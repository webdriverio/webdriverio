/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    client
        .url('http://github.com')
        .getLocation('.header-logo-wordmark', function(err, location) {
            console.log(location); // outputs: { x: 20, y: 20 }
        })
 * </example>
 *
 * @param {String} selector    element with requested position offset
 * @returns {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 *
 * @uses protocol/elements, protocol/elementIdLocation
 * @type property
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getLocation (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getLocation command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdLocation = [];

            if(res.value.length === 0) {
                // throw NoSuchElement error if no element was found
                return callback(new ErrorHandler(7));
            }

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdLocation(val.ELEMENT, function(err,res) {
                    response.elementIdLocation.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdLocation && response.elementIdLocation.length === 1) {

            value = {
                x: parseInt(response.elementIdLocation[0].value.x, 10),
                y: parseInt(response.elementIdLocation[0].value.y, 10)
            };

        } else if(response.elementIdLocation && response.elementIdLocation.length > 1) {

            value = response.elementIdLocation.map(function(res) {
                return {
                    x: parseInt(res.value.x, 10),
                    y: parseInt(res.value.y, 10)
                };
            });

        }

        callback(err, value, response);

    });

};