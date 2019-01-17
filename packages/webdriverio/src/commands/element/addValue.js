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
    it('should demonstrate the addValue command', () => {
        let input = $('.input')
        input.addValue('test')
        input.addValue(123)

        value = input.getValue()
        assert(value === 'test123') // true
    })
 * </example>
 *
 * @alias element.addValue
 * @param {*}      value     value to be added
 * @uses protocol/elements, protocol/elementIdValue
 * @type action
 *
 */

import { transformToCharString } from '../../utils'

export default function addValue (value) {
    if (!this.isW3C || this.isMobile) {
        return this.elementSendKeys(this.elementId, transformToCharString(value))
    }

    return this.elementSendKeys(this.elementId, value)
}
