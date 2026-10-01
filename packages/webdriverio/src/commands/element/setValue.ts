import { getBrowserObject } from '@wdio/utils'

import type { InputOptions } from '../../types.js'
import { Key } from '../../constants.js'
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
    const context = await foreignContextId(this)
    if (context) {
        /**
         * Classic `elementClear` and `elementSendKeys` only reach the session
         * pointer's document. Select the current content, then type over it
         * with key actions in the element's own context, so controlled inputs
         * see the same keystrokes a user would send.
         */
        await this.execute((el: HTMLElement) => {
            el.focus()
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.select()
                return
            }
            const selection = el.ownerDocument.getSelection()
            const range = el.ownerDocument.createRange()
            range.selectNodeContents(el)
            selection?.removeAllRanges()
            selection?.addRange(range)
        })
        const text = String(value)
        const keys = text.length > 0 ? Array.from(text) : [Key.Backspace]
        const browser = getBrowserObject(this)
        await browser.inputPerformActions({
            context,
            actions: [{
                id: 'keyboard',
                type: 'key',
                actions: keys.flatMap((key) => [
                    { type: 'keyDown' as const, value: key },
                    { type: 'keyUp' as const, value: key }
                ])
            }]
        })
        await browser.inputReleaseActions({ context })
        return
    }
    await this.clearValue()
    return this.addValue(value, options)
}
