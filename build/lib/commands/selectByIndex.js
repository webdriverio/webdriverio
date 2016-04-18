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

    :selectByIndexAsync.js
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

    :selectByIndexSync.js
    it('should demonstrate the selectByIndex command', function () {
        var selectBox = browser.element('#selectbox');
        console.log(selectBox.getValue()); // returns "someValue0"

        selectBox.selectByIndex(4);
        console.log(selectBox.getValue()); // returns "someValue4"
    });
 * </example>
 *
 * @param {String} selector   select element that contains the options
 * @param {Number} index      option index
 *
 * @uses protocol/element, protocol/elementIdElements, protocol/elementIdClick
 * @type action
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var selectByIndex = function selectByIndex(selector, index) {
    var _this = this;

    /*!
     * negative index check
     */
    if (index < 0) {
        throw new _utilsErrorHandler.CommandError('index needs to be 0 or any other positive number');
    }

    return this.element(selector).then(function (element) {
        return _this.elementIdElements(element.value.ELEMENT, '<option>');
    }).then(function (elements) {
        if (elements.value.length === 0) {
            throw new _utilsErrorHandler.CommandError('select element (' + selector + ') doesn\'t contain any option element');
        }
        if (elements.value.length - 1 < index) {
            throw new _utilsErrorHandler.CommandError('option with index "' + index + '" not found. Select element (' + selector + ') only contains ' + elements.value.length + ' option elements');
        }

        return _this.elementIdClick(elements.value[index].ELEMENT);
    });
};

exports['default'] = selectByIndex;
module.exports = exports['default'];
