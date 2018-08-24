/**
 *
 * Select option with displayed text matching the argument.
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
    it('demonstrate the selectByVisibleText command', function () {
        const selectBox = $('#selectbox');
        console.log(selectBox.getText('option:checked')); // returns "uno"
        selectBox.selectByVisibleText('cuatro');
        console.log(selectBox.getText('option:checked')); // returns "cuatro"
    })
 * </example>
 *
 * @alias element.selectByVisibleText
 * @param {String} text       text of option element to get selected
 * @uses protocol/findElementsFromElement, protocol/elementClick
 * @type action
 *
 */

import { getElementFromResponse } from '../../utils'

export default async function selectByVisibleText (text) {
    /**
     * convert value into string
     */
    text = typeof text === 'number'
        ? text.toString()
        : text

    /**
    * find option element using xpath
    */
    const formatted = /"/.test(text)
        ? 'concat("' + text.trim().split('"').join('", \'"\', "') + '")'
        : `"${text.trim()}"`
    const normalized = `[normalize-space(text()) = ${formatted}]`
    const optionElement = await this.findElementFromElement(this.elementId, 'xpath', `./option${normalized}|./optgroup/option${normalized}`)

    /**
    * select option
    */
    return this.elementClick(getElementFromResponse(optionElement))
}
