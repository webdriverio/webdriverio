import type { InputOptions } from '../../types.js'

import { foreignContextId } from '../../session/browsingContext.js'

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
 * <example>
    :setValue.js
    it('should set value for a certain element', async () => {
        const input = await $('.input');
        await input.setValue('test')
        await input.setValue(123)

        console.log(await input.getValue()); // outputs: '123'
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
    if (await foreignContextId(this)) {
        const next = String(value)
        await this.execute((el: HTMLInputElement, text: string) => {
            el.focus()
            el.value = text
            el.dispatchEvent(new Event('input', { bubbles: true }))
            el.dispatchEvent(new Event('change', { bubbles: true }))
        }, next)
        return
    }
    await this.clearValue()
    return this.addValue(value, options)
}
