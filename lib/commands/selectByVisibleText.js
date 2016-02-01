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

import { CommandError } from '../utils/ErrorHandler'

let selectByVisibleText = function (selectElem, text) {
    /*!
     * parameter check
     */
    if (typeof selectElem !== 'string' || typeof text !== 'string') {
        throw new CommandError(`number or type of arguments don't agree with selectByVisibleText command`)
    }

    /**
     * get select element
     */
    return this.element(selectElem).then((res) => {
        /**
         * find option elem using xpath
         */
        let formatted = `"${text.trim()}"`

        if (/"/.test(text)) {
            formatted = 'concat("' + text.trim().split('"').join('", \'"\', "') + '")' // escape quotes
        }

        var normalized = `[normalize-space(.) = ${formatted}]`
        return this.elementIdElement(res.value.ELEMENT, `./option${normalized}|./optgroup/option${normalized}`)
    }).then((res) => {
        /**
         * select option
         */
        return this.elementIdClick(res.value.ELEMENT)
    })
}

export default selectByVisibleText
