import { getElementFromResponse } from '../../utils/index.js'

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
    it('Should demonstrate the selectByIndex command', async () => {
        const selectBox = await $('#selectbox');
        console.log(await selectBox.getValue()); // returns "someValue0"
        await selectBox.selectByIndex(4);
        console.log(await selectBox.getValue()); // returns "someValue4"
    });
 * </example>
 *
 * @alias element.selectByIndexs
 * @param {Number} index      option index
 * @uses protocol/findElementsFromElement, protocol/elementClick
 * @type action
 *
 */
export async function selectByIndex (
    this: WebdriverIO.Element,
    index: number
) {
    /**
     * negative index check
     */
    if (index < 0) {
        throw new Error('Index needs to be 0 or any other positive number')
    }

    /**
    * get option elememnts using css
    */
    const optionElements = await this.findElementsFromElement(this.elementId, 'css selector',  'option')

    if (optionElements.length === 0) {
        throw new Error('Select element doesn\'t contain any option element')
    }

    if (optionElements.length - 1 < index) {
        throw new Error(`Option with index "${index}" not found. Select element only contains ${optionElements.length} option elements`)
    }

    /**
    * select option
    */
    return this.elementClick(getElementFromResponse(optionElements[index]) as string)
}
