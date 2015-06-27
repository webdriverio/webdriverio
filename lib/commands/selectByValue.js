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
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue0"
        })
        .selectByValue('#selectbox', 'someValue3')
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue3"
        });
 * </example>
 *
 * @param {String} selectElem select element that contains the options
 * @param {String} value      value of option element to get selected
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function selectByValue (selectElem, value) {

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
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with selectByValue command');
    }

    /**
     * get options element by xpath
     */
    return this.element(selectElem).then(function(res) {

        /**
         * find option elem using xpath
         */
        var normalized = '[normalize-space(@value) = "' + value.trim() + '"]';
        return this.elementIdElement(res.value.ELEMENT, './option' + normalized + '|./optgroup/option' + normalized);

    }).then(function(res) {

        /**
         * select option
         */
        return this.elementIdClick(res.value.ELEMENT);

    });

};

