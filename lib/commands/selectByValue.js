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

let selectByValue = function (selectElem, value) {
    return this.selectByAttribute(selectElem, 'value', value)
}

export default selectByValue
