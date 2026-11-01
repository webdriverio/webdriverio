import { getBrowserObject, toXPathStringLiteral } from '@wdio/utils'

import { getElementFromResponse } from '../../utils/index.js'
import { bidiDisabledSelectError, bidiSelectByVisibleText, isBidiCommandsEnabled, type BidiDisabledSource } from '../../utils/bidi/elementCommands.js'

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
export async function selectByVisibleText (
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
        .replace(/\s+/g, ' ') // replace sequences of whitespace characters by a single space

    const browser = getBrowserObject(this) as WebdriverIO.Browser
    if (isBidiCommandsEnabled(browser)) {
        let disabled: BidiDisabledSource | undefined
        await this.waitUntil(async () => {
            const result = await bidiSelectByVisibleText(this, normalized)
            disabled = result.disabled
            return result.selected || !!disabled
        }, {
            timeoutMsg: `Option with text "${text}" not found.`
        })
        if (disabled) {
            throw bidiDisabledSelectError('selectByVisibleText', `option with text "${text}"`, disabled)
        }
        return
    }

    /**
    * find option element using xpath
    */
    const formatted = toXPathStringLiteral(normalized)
    const dotFormat = `[. = ${formatted}]`
    const spaceFormat = `[normalize-space(text()) = ${formatted}]`

    const selections = [
        `./option${dotFormat}`,
        `./option${spaceFormat}`,
        `./optgroup/option${dotFormat}`,
        `./optgroup/option${spaceFormat}`,
    ]

    /**
     * the XPath union above intentionally matches every option variant, we only
     * care about the first hit, so opt out of strict selector semantics here
     */
    const optionElement = await this.$(selections.join('|'), { strict: false })
    if (!await optionElement.isExisting()) {
        /**
         * An XPath from an element inside a shadow root finds nothing, so a
         * select in a web component looks empty to it. The select's own
         * `options` list has them.
         */
        const option = await getBrowserObject(this).execute(function (select: HTMLSelectElement, wanted: string) {
            const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
            return Array.from(select.options || []).find((o) => normalize(o.text) === wanted || normalize(o.label) === wanted) || null
        }, this as unknown as HTMLSelectElement, normalized) as unknown
        // an element object, or a raw WebDriver element reference, depending on the protocol
        const optionId = option && typeof option === 'object'
            ? (option as { elementId?: string }).elementId ?? getElementFromResponse(option as Parameters<typeof getElementFromResponse>[0])
            : undefined
        if (optionId) {
            return this.elementClick(optionId)
        }
    }
    await optionElement.waitForExist({
        timeoutMsg: `Option with text "${text}" not found.`
    })

    /**
    * select option
    */
    return this.elementClick(getElementFromResponse(optionElement) as string)
}
