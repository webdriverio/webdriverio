/**
 *
 * Return true or false if the selected DOM-element found by css selector is visible.
 *
 * @param {String} selector     DOM-element
 * @returns {Boolean|Boolean[]} true if element(s)* [is|are] visible
 *
 * @uses protocol/elements, protocol/elementIdDisplayed
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function isVisible (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with isVisible command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdDisplayed = [];

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdDisplayed(val.ELEMENT, function(err,res) {
                    if(res) {
                        response.elementIdDisplayed.push(res);
                    }

                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdDisplayed && response.elementIdDisplayed.length === 1) {

            value = response.elementIdDisplayed[0].value;

        } else if(response.elementIdDisplayed && response.elementIdDisplayed.length > 1) {

            value = response.elementIdDisplayed.map(function(res) {
                return res.value;
            });

        }

        callback(err, value || false, response);

    });

};