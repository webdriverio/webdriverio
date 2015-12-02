/**
 *
 * Select option with a specific name.
 *
 * <example>
    :example.html
    <select id="selectbox">
        <option name="someName0" value="someValue0">uno</option>
        <option name="someName1" value="someValue1">dos</option>
        <option name="someName2" value="someValue2">tres</option>
        <option name="someName3" value="someValue3">cuatro</option>
        <option name="someName4" value="someValue4">cinco</option>
        <option name="someName5" value="someValue5">seis</option>
    </select>

    :selectByName.js
    client
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue0"
        })
        .selectByName('#selectbox', 'someName3')
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue3"
        });
 * </example>
 *
 * @param {String} selectElem select element that contains the options
 * @param {String} name      name of option element to get selected
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');
var staleElementRetry = require('../helpers/staleElementRetry');

module.exports = function selectByName (selectElem, name) {

    /**
     * convert name into string
     */
    if(typeof name === 'number') {
        name = name.toString();
    }

    /*!
     * parameter check
     */
    if(typeof selectElem !== 'string' || typeof name !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with selectByName command');
    }

    /**
     * get options element by xpath
     */
    return this.element(selectElem).then(function(res) {

        /**
         * find option elem using xpath
         */
        var normalized = '[normalize-space(@name) = "' + name.trim() + '"]';
        return this.elementIdElement(res.value.ELEMENT, './option' + normalized + '|./optgroup/option' + normalized);

    }).then(function(res) {

        /**
         * select option
         */
        return this.elementIdClick(res.value.ELEMENT);

    })
    .catch(staleElementRetry.bind(this, 'selectByName', arguments));

};

