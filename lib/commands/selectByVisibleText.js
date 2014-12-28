/**
 *
 * Select option that display text matching the argument.
 *
 * @param {String} selectElem select element that contains the options
 * @param {String} text       text of option element to get selected
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function selectByVisibleText (selectElem, text) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selectElem !== 'string' || typeof text !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with selectByVisibleText command'));
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
            return that.elementIdElement(res.value.ELEMENT, './option[normalize-space(.) = "' + text.trim() + '"]', cb)
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

