import type { ElementReference } from '@wdio/protocols'
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
 * @param {number} index      option index
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

    const fetchOptionElements = async () => {
        return this.findElementsFromElement(this.elementId, 'css selector',  'option')
    }

    /**
    * get option elememnts using css
    */
    let optionElements: ElementReference[] = []
    await this.waitUntil(async () => {
        optionElements = await fetchOptionElements()
        return optionElements.length > 0
    }, {
        timeoutMsg: 'Select element doesn\'t contain any option element'
    })

    await this.waitUntil(async () => {
        optionElements = await fetchOptionElements()
        return typeof optionElements[index] !== 'undefined'
    }, {
        timeoutMsg: `Option with index "${index}" not found. Select element only contains ${optionElements.length} option elements`
    })

    /**
    * select option
    */
    return this.elementClick(getElementFromResponse(optionElements[index]) as string)
}
