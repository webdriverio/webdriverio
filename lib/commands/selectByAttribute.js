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
        <option name="someName5" value="someValue5">seis</option>
    </select>

    :selectByAttribute.js
    client
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue0"
        })
        .selectByAttribute('#selectbox', 'value', 'someValue3')
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue3"
        })

        .selectByAttribute('#selectbox', 'name', 'someName5')
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue5"
        });
 * </example>
 *
 * @param {String} selectElem select element that contains the options
 * @param {String} attribute  attribute of option element to get selected
 * @param {String} value      value of option element to get selected
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let selectByAttribute = function (selectElem, attribute, value) {
    /**
     * convert value into string
     */
    if (typeof value === 'number') {
        value = value.toString()
    }

    /*!
     * parameter check
     */
    if (typeof selectElem !== 'string' || typeof attribute !== 'string' || typeof value !== 'string') {
        throw new CommandError(`number or type of arguments don't agree with selectByAttribute command`)
    }

    /**
     * get options element by xpath
     */
    return this.element(selectElem).then((res) => {
        /**
         * find option elem using xpath
         */
        var normalized = `[normalize-space(@${attribute.trim()}) = "${value.trim()}"]`
        return this.elementIdElement(res.value.ELEMENT, `./option${normalized}|./optgroup/option${normalized}`)
    }).then((res) => {
        /**
         * select option
         */
        return this.elementIdClick(res.value.ELEMENT)
    })
}

export default selectByAttribute
