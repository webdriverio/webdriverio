/**
 *
 * Select option that display text matching the argument.
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

    :selectByVisibleText.js
    client
        .getText('#selectbox option:checked').then(function(value) {
            console.log(value);
            // returns "uno"
        })
        .selectByVisibleText('#selectbox', 'cuatro')
        .getText('#selectbox option:checked').then(function(value) {
            console.log(value);
            // returns "cuatro"
        });
 * </example>
 *
 * @param {String} selectElem select element that contains the options
 * @param {String} text       text of option element to get selected
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function selectByVisibleText (selectElem, text) {

    /*!
     * parameter check
     */
    if(typeof selectElem !== 'string' || typeof text !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with selectByVisibleText command');
    }

    /**
     * get select element
     */
    return this.element(selectElem).then(function(res) {

        /**
         * find option elem using xpath
         */
        var normalized = '[normalize-space(.) = "' + text.trim() + '"]';
        return this.elementIdElement(res.value.ELEMENT, './option' + normalized + '|./optgroup/option' + normalized);

    }).then(function(res) {

        /**
         * select option
         */
        return this.elementIdClick(res.value.ELEMENT);

    });

};

