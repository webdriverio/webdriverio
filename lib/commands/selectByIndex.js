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
        .getValue('#selectbox')
        .then(function(value) {
            console.log(value);
            // returns "someValue0"
        })
        .selectByIndex('#selectbox', 4)
        .getValue('#selectbox')
        .then(function(value) {
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
    Q = require('q'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function selectByIndex (selectElem, index) {

    /*!
     * parameter check
     */
    if(typeof selectElem !== 'string' || typeof index !== 'number') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with selectByIndex command');
    }

    /*!
     * negative index check
     */
    if(index < 0) {
        throw new ErrorHandler.CommandError('index needs to be 0 or any other positive number');
    }

    var that = this;

    return this.element(selectElem)
        .then(function(element){
            return this.elementIdElements(element.value.ELEMENT, '<option>');
        })
        .then(function(elements){
            if(elements.value.length === 0) {
                return 'select element (' + selectElem + ') doesn\'t contain any option element';
            }
            if(elements.value.length - 1 < index) {
                return 'option with index "' + index + '" not found. Select element (' + selectElem + ') only contains ' + elements.value.length + ' option elements';
            }

            return that.elementIdClick(elements.value[index].ELEMENT);
        });
};

