/**
 *
 * Select option with a specific index.
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

    :selectByIndex.js
    client
        .getValue('#selectbox', function(error, value) {
            console.log(value);
            // returns "someValue0"
        })
        .selectByIndex('#selectbox', 4)
        .getValue('#selectbox', function(error, value) {
            console.log(value);
            // returns "someValue4"
        });
 * </example>
 *
 * @param {String} selectElem select element that contains the options
 * @param {Number} index      option index
 * @callbackParameter error
 *
 * @uses protocol/element, protocol/elementIdElements, protocol/elementIdClick
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function selectByIndex (selectElem, index) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selectElem !== 'string' || typeof index !== 'number') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with selectByIndex command'));
    }

    /*!
     * negative index check
     */
    if(index < 0) {
        return callback(new ErrorHandler.CommandError('index needs to be 0 or any other positive number'));
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
         * get all option elements
         */
        function(res, cb) {
            response.element = res;

            /**
             * find option elem using xpath
             */
            return that.elementIdElements(res.value.ELEMENT, '<option>', cb)
        },
        /**
         * select option
         */
        function(res, cb) {
            response.elementIdElements = res;

            if(res.value.length === 0) {
                return cb('select element (' + selectElem + ') doesn\'t contain any option element');
            }
            if(res.value.length - 1 < index) {
                return cb('option with index "' + index + '" not found. Select element (' + selectElem + ') only contains ' + res.value.length + ' option elements');
            }

            that.elementIdClick(res.value[index].ELEMENT, cb);
        },
        function(res, cb) {
            response.elementIdClick = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    })

};

