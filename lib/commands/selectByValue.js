/**
 *
 * Select option with a specific value.
 *
 * @param {String} selectElem select element that contains the options
 * @param {String} value      value of option element to get selected
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
            return that.elementIdElement(res.value.ELEMENT, './option[normalize-space(@value) = "' + value.trim() + '"]', cb)
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

