/**
 *
 * Send a sequence of key strokes to an element (clears value before). If the element
 * doesn't need to be cleared first then use addValue. You can also use
 * unicode characters like Left arrow or Back space. WebdriverIO will take care of
 * translating them into unicode characters. You’ll find all supported characters
 * [here](https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions).
 * To do that, the value has to correspond to a key from the table.
 *
 * <example>
    :setValue.js
    it('should set value for a certain element', () => {
        const input = $('.input');
        input.setValue('test123');

        console.log(input.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.setValue
 * @param {string | number | boolean | object | Array<any>}      value    Value to be added
 * @uses protocol/elements, protocol/elementIdClear, protocol/elementIdValue
 * @type action
 *
 */

export default async function setValue (value) {
    await this.clearValue()
    return this.addValue(value)
}
