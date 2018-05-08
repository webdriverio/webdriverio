/**
 *
 * Add a value to an object found by given selector. You can also use unicode
 * characters like Left arrow or Back space. WebdriverIO will take care of
 * translating them into unicode characters. You’ll find all supported characters
 * [here](https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions).
 * To do that, the value has to correspond to a key from the table.
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', function () {
        var input = $('.input')
        input.setValue('test')
        input.addValue(123)
        // same as
        browser.setValue('.input', 'test')
        browser.addValue('.input', '123')
        var value = elem.getValue()
        assert(value === 'test123') // true
    })
 * </example>
 *
 * @alias browser.addValue
 * @param {String}        selector   Input element
 * @param {String|Number} values     value to be added
 * @uses protocol/elements, protocol/elementIdValue
 * @type action
 *
 */

import { transformToCharString } from '../../utils'

export default function addValue (value) {
    let text = transformToCharString(value)

    if (this.isW3C) {
        text = text.join('')
    }

    return this.elementSendKeys(this.elementId, text)
}
