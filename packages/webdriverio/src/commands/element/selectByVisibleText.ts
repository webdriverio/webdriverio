import { getElementFromResponse } from '../../utils/index.js'

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
    it('demonstrate the selectByVisibleText command', async () => {
        const selectBox = await $('#selectbox');
        console.log(await selectBox.getText('option:checked')); // returns "uno"
        await selectBox.selectByVisibleText('cuatro');
        console.log(await selectBox.getText('option:checked')); // returns "cuatro"
    })
 * </example>
 *
 * @alias element.selectByVisibleText
 * @param {String|Number} text       text of option element to get selected
 * @uses protocol/findElementsFromElement, protocol/elementClick
 * @type action
 *
 */
export default async function selectByVisibleText (
    this: WebdriverIO.Element,
    text: string | number
) {
    /**
     * convert value into string
     */
    text = typeof text === 'number'
        ? text.toString()
        : text

    const normalized = text
        .trim() // strip leading and trailing white-space characters
        .replace(/\s+/, ' ') // replace sequences of whitespace characters by a single space

    /**
    * find option element using xpath
    */
    const formatted = /"/.test(normalized)
        ? 'concat("' + normalized.split('"').join('", \'"\', "') + '")'
        : `"${normalized}"`
    const dotFormat = `[. = ${formatted}]`
    const spaceFormat = `[normalize-space(text()) = ${formatted}]`

    const selections = [
        `./option${dotFormat}`,
        `./option${spaceFormat}`,
        `./optgroup/option${dotFormat}`,
        `./optgroup/option${spaceFormat}`,
    ]

    const optionElement = await this.findElementFromElement(this.elementId, 'xpath', selections.join('|'))

    if (optionElement && (optionElement as any).error === 'no such element') {
        throw new Error(`Option with text "${text}" not found.`)
    }

    /**
    * select option
    */
    return this.elementClick(getElementFromResponse(optionElement) as string)
}
