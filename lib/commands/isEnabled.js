/**
 *
 * Return true or false if the selected DOM-element found by given selector is enabled.
 *
 * <example>
    :index.html
    <input type="text" name="inputField" class="input1">
    <input type="text" name="inputField" class="input2" disabled>
    <input type="text" name="inputField" class="input3" disabled="disabled">

    :isVisible.js
    client
        .isEnabled('.input1', function(err, isEnabled) {
            console.log(isEnabled); // outputs: true
        })
        .isEnabled('#input2', function(err, isEnabled) {
            console.log(isEnabled); // outputs: false
        })
        .isEnabled('#input3', function(err, isEnabled) {
            console.log(isEnabled); // outputs: false
        })
 * </example>
 *
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* (is|are) visible
 *
 * @uses protocol/elements, protocol/elementIdEnabled
 * @type state
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function isEnabled (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with isEnabled command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdEnabled = [];

            if(res.value.length === 0) {
                // throw NoSuchElement error if no element was found
                return callback(new ErrorHandler(7));
            }

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdEnabled(val.ELEMENT, function(err,res) {
                    if(res) {
                        response.elementIdEnabled.push(res);
                    }

                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdEnabled && response.elementIdEnabled.length === 1) {

            value = response.elementIdEnabled[0].value;

        } else if(response.elementIdEnabled && response.elementIdEnabled.length > 1) {

            value = response.elementIdEnabled.map(function(res) {
                return res.value;
            });

        }

        callback(err, value || false, response);

    });

};