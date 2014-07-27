/**
 *
 * Returns true if at least one element is existing by given selector
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>

    :isExisting.js
    client
        .isExisting('#someRandomNonExistingElement', function(err, isExisting) {
            console.log(isExisting); // outputs: false
        })
        .isExisting('#notDisplayed', function(err, isExisting) {
            console.log(isExisting); // outputs: true
        })
        .isExisting('#notVisible', function(err, isExisting) {
            console.log(isExisting); // outputs: true
        })
        .isExisting('#notInViewport', function(err, isExisting) {
            console.log(isExisting); // outputs: true
        })
        .isExisting('#zeroOpacity', function(err, isExisting) {
            console.log(isExisting); // outputs: true
        })
 * </example>
 *
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* [is|are] existing
 *
 * @uses protocol/elements
 * @type state
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function isExisting (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with isExisting command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            cb();
        }
    ], function(err) {

        var value = null;

        if(response.elements.value && response.elements.value instanceof Array && response.elements.value.length > 0) {
            value = true;
        }

        callback(err, value || false, response);

    });

};