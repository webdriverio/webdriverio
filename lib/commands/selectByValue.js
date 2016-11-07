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
    it('should demonstrate the selectByValue command', function () {
        var selectBox = $('#selectbox');
        console.log(selectBox.getValue()); // returns "someValue0"

        selectBox.selectByValue('someValue3');
        console.log(selectBox.getValue()); // returns "someValue3"
    });
 * </example>
 *
 * @alias browser.selectByValue
 * @param {String} selector   select element that contains the options
 * @param {String} value      value of option element to get selected
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

let selectByValue = function (selector, value) {
    return this.selectByAttribute(selector, 'value', value)
}

export default selectByValue
