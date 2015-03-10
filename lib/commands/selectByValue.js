/**
 *
 * Select option with a specific value.
 *
 * <example>
    :example.html
    <select id="selectbox">
        <option value="someValue0">uno</option>
        <option value="someValue1">dos</option>
        <option value="someValue2">tres</option>
        <option value="someValue3">cuatro</option>
        <option value="someValue4">cinco</option>
        <option value="someValue5">seis</option>
    </select>

    :selectByValue.js
    client
        .getValue('#selectbox', function(error, value) {
            console.log(value);
            // returns "someValue0"
        })
        .selectByValue('#selectbox', 'someValue3')
        .getValue('#selectbox', function(error, value) {
            console.log(value);
            // returns "someValue3"
        });
 * </example>
 *
 * @param {String} selectElem select element that contains the options
 * @param {String} value      value of option element to get selected
 * @callbackParameter error
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function selectByValue (selectElem, value) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * convert value into string
     */
    if(typeof value === 'number') {
        value = value.toString();
    }

    /*!
     * parameter check
     */
    if(typeof selectElem !== 'string' || typeof value !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with selectByValue command'));
    }

    var that = this,
        response = {},
        option;

    async.waterfall([
        /**
         * get select element
         */
        function(cb) {
            that.element(selectElem, cb);
        },
        /**
         * get options element by xpath
         */
        function(res, cb) {
            response.element = res;

            /**
             * find option elem using xpath
             */
            var normalized = '[normalize-space(@value) = "' + value.trim() + '"]';
            return that.elementIdElement(res.value.ELEMENT, './option' + normalized + '|./optgroup/option' + normalized, cb);
        },
        /**
         * select option
         */
        function(res, cb) {
            response.elementIdElement = res;
            that.elementIdClick(res.value.ELEMENT, cb);
        },
        function(res, cb) {
            response.elementIdClick = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    })

};

