import type { CommandOptions, Value } from './addValue'

/**
 *
 * Send a sequence of key strokes to an element (clears value before). If the element
 * doesn't need to be cleared first then use addValue. You can also use
 * unicode characters like Left arrow or Back space. WebdriverIO will take care of
 * translating them into unicode characters. You’ll find all supported characters
 * [here](https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions).
 * To do that, the value has to correspond to a key from the table. It can be disabled
 * by setting `translateToUnicode` optional parameter to false.
 *
 * <example>
    :setValue.js
    it('should set value for a certain element', async () => {
        const input = await $('.input');
        await input.setValue('test123');

        console.log(await input.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.setValue
 * @param {string | number | Array<string | number>}        value                       value to be added
 * @param {CommandOptions=}                                 options                     command options (optional)
 * @param {boolean}                                         options.translateToUnicode  enable translation string to unicode value automatically
 *
 */
export default async function setValue (
    this: WebdriverIO.Element,
    value: Value | Value[],
    { translateToUnicode = true }: CommandOptions = {}
) {
    await this.clearValue()
    return this.addValue(value, { translateToUnicode })
}
