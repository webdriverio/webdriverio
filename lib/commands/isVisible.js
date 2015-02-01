/**
 *
 * Return true or false if the selected DOM-element found by given selector is visible.
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>

    :isVisible.js
    client
        .isVisible('#notDisplayed', function(err, isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notVisible', function(err, isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notInViewport', function(err, isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#zeroOpacity', function(err, isVisible) {
            console.log(isVisible); // outputs: true!!!
        })
 * </example>
 *
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* [is|are] visible
 *
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
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

            if(res.value.length === 0) {
                /**
                 * if element does not exist it is automatically not visible ;-)
                 */
                return callback(undefined, false, response);
            }

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