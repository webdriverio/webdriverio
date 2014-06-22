/**
 *
 * Return true or false if an `<option>` element, or an `<input>` element of type
 * checkbox or radio is currently selected found by given selector.
 *
 * <example>
    :index.html
    <select name="selectbox" id="selectbox">
        <option value="John Doe">John Doe</option>
        <option value="Layla Terry" selected="selected">Layla Terry</option>
        <option value="Bill Gilbert">Bill Gilbert"</option>
    </select>

    :isSelected.js
    client.isSelected('[value="Layla Terry"]', function(err, isSelected) {
        console.log(isSelected); // outputs: true
    });
 * </example>
 *
 * @param   {String}             selector  option element or input of type checkbox or radio
 * @returns {Boolean|Boolean[]}            true if element is selected
 *
 * @uses protocol/elements, protocol/elementIdSelected
 * @type state
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function isSelected (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with isSelected command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.elements(selector, cb);
        },
        function(res, cb) {
            response.elements = res;
            response.elementIdSelected = [];

            if(res.value.length === 0) {
                // throw NoSuchElement error if no element was found
                return callback(new ErrorHandler(7));
            }

            async.eachSeries(res.value, function(val, seriesCallback) {
                self.elementIdSelected(val.ELEMENT, function(err,res) {
                    if(res) {
                        response.elementIdSelected.push(res);
                    }

                    seriesCallback(err);
                });
            }, cb);
        }
    ], function(err) {

        var value = null;

        if(response.elementIdSelected && response.elementIdSelected.length === 1) {

            value = response.elementIdSelected[0].value;

        } else if(response.elementIdSelected && response.elementIdSelected.length > 1) {

            value = response.elementIdSelected.map(function(res) {
                return res.value;
            });

        }

        callback(err, value, response);

    });

};