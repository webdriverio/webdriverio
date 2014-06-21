/**
 *
 * Get the width and height for an DOM-element based given selector.
 *
 * <example>
    :getElementSize.js
    client
        .getElementSize('.header-logo-wordmark', function(err,size) {
            console.log(size) // outputs: { width: 37, height: 33 }
        })
 * </example>
 *
 * @param   {String} selector element with requested size
 * @returns {Object}          requested element size (`{width:number, height:number}`)
 *
 * @uses protocol/elements, protocol/elementIdSize
 * @type property
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getElementSize (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with getElementSize command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdSize = [];

            if(res.value.length === 0) {
                // throw NoSuchElement error if no element was found
                return callback(new ErrorHandler(7));
            }

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdSize(val.ELEMENT, function(err,res) {
                    response.elementIdSize.push(res);
                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdSize && response.elementIdSize.length === 1) {

            value = {
                width: response.elementIdSize[0].value.width,
                height: response.elementIdSize[0].value.height
            };

        } else if(response.elementIdSize && response.elementIdSize.length > 1) {

            value = response.elementIdSize.map(function(res) {
                return {
                    width: res.value.width,
                    height: res.value.height
                };
            });

        }

        callback(err, value, response);

    });

};