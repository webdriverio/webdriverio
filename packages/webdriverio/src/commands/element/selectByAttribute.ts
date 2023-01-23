import { getElementFromResponse } from '../../utils/index.js'

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
    it('Should demonstrate the selectByAttribute command', async () => {
        const selectBox = await $('#selectbox');
        const value = await selectBox.getValue();
        console.log(value); // returns "someValue0"

        await selectBox.selectByAttribute('value', 'someValue3');
        console.log(await selectBox.getValue()); // returns "someValue3"

        await selectBox.selectByAttribute('name', 'someName5');
        console.log(await selectBox.getValue()); // returns "someValue5"
    });
 * </example>
 *
 * @alias element.selectByAttribute
 * @param {String} attribute     attribute of option element to get selected
 * @param {String|Number} value  value of option element to get selected
 * @uses protocol/findElementFromElement, protocol/elementClick
 * @type action
 *
 */
export async function selectByAttribute (
    this: WebdriverIO.Element,
    attribute: string,
    value: string | number
) {
    /**
     * convert value into string
     */
    value = typeof value === 'number'
        ? value.toString()
        : value

    /**
    * find option elememnt using xpath
    */
    const normalized = `[normalize-space(@${attribute.trim()}) = "${value.trim()}"]`
    const optionElement = await this.findElementFromElement(
        this.elementId,
        'xpath',
        `./option${normalized}|./optgroup/option${normalized}`
    )

    if (optionElement && (optionElement as any).error === 'no such element') {
        throw new Error(`Option with attribute "${attribute}=${value}" not found.`)
    }

    /**
    * select option
    */
    return this.elementClick(getElementFromResponse(optionElement) as string)
}
