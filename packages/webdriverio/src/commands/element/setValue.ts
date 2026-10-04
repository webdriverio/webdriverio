import { getBrowserObject } from '@wdio/utils'

import type { InputOptions } from '../../types.js'

/**
 * Input types whose value can't be typed: a range input ignores key strokes,
 * and date and time inputs split their value into segments that typing fills
 * in the browser's locale order, so "2026-10-04" ends up as "61004-02-02".
 * `setValue` sets their value like the browser's own picker does instead.
 */
const SET_DIRECTLY = ['range', 'date', 'datetime-local', 'month', 'week', 'time', 'color']

/**
 * Send a sequence of key strokes to an element after the input has been cleared before. If the element doesn't need
 * to be cleared first then use [`addValue`](/docs/api/element/addValue).
 *
 * :::info
 *
 * If you like to use special characters, e.g. to copy and paste a value from one input to another, use the
 * [`keys`](/docs/api/browser/keys) command with the [`Key`](/docs/api/modules#key) object.
 *
 * :::
 *
 * Inputs of type `range`, `date`, `datetime-local`, `month`, `week`, `time` and `color` don't take key strokes
 * as typed text. For them `setValue` sets the value directly and fires the `input` and `change` events, as
 * picking a value with the mouse does. Pass the value in the input's own format, e.g. `2026-10-04` for a date
 * or `14:30` for a time. The browser corrects values that don't fit, like a range input does with a value
 * between two steps; read the result with [`getValue`](/docs/api/element/getValue).
 *
 * <example>
    :setValue.js
    it('should set value for a certain element', async () => {
        const input = await $('.input');
        await input.setValue('test')
        await input.setValue(123)

        console.log(await input.getValue()); // outputs: '123'
    });

    it('should set the value of a date input', async () => {
        const input = await $('input[type="date"]');
        await input.setValue('2026-10-04')

        console.log(await input.getValue()); // outputs: '2026-10-04'
    });
 * </example>
 *
 * @alias element.setValue
 * @param {string|number}  value  value to be added
 * @param {InputOptions} additional options, exclusive to Webdriverio
 *
 */
export async function setValue (
    this: WebdriverIO.Element,
    value: string | number,
    options?: InputOptions,
) {
    if ((typeof value === 'string' || typeof value === 'number') && await setsDirectly(this)) {
        const browser = getBrowserObject(this)
        const done = await browser.execute(function setInputValue (elem: HTMLInputElement, newValue: string) {
            // leave a field the user can't change to the key strokes, which fail with the reason
            if (elem.disabled || elem.readOnly) {
                return false
            }
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
            setter.call(elem, newValue)
            elem.dispatchEvent(new Event('input', { bubbles: true }))
            elem.dispatchEvent(new Event('change', { bubbles: true }))
            return true
        }, this as unknown as HTMLInputElement, value.toString())
        if (done) {
            return
        }
    }
    await this.clearValue()
    return this.addValue(value, options)
}

/**
 * whether the element is an input that takes its value directly, see SET_DIRECTLY
 */
async function setsDirectly (elem: WebdriverIO.Element) {
    const browser = getBrowserObject(elem)
    // native apps have no DOM to set a value in
    if (browser.isMobile && (browser.isNativeContext || browser.isWindowsApp || browser.isMacApp)) {
        return false
    }
    const type = await elem.getElementProperty(elem.elementId, 'type').catch(() => undefined)
    return typeof type === 'string' && SET_DIRECTLY.includes(type)
}
