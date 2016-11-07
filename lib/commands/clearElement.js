/**
 *
 * Clear a `<textarea>` or text `<input>` element’s value. Make sure you can interact with the
 * element before using this command. You can't clear an input element that is disabled or in
 * readonly mode.
 *
 * <example>
    :clearElement.js
    it('should demonstrate the clearElement command', function () {
        var input = $('.input')
        input.setValue('test123')
        console.log(input.getValue()) // returns 'test123'

        input.clearElement()
        // or
        browser.clearElement('.input')

        var value = browser.getValue('.input')
        assert(value === ''); // true
    })
 * </example>
 *
 * @alias browser.clearElement
 * @param {String} selector input element
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let clearElement = function (selector) {
    return this.elements(selector).then((res) => {
        if (!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        let elementIdClearCommands = []
        for (let elem of res.value) {
            elementIdClearCommands.push(this.elementIdClear(elem.ELEMENT, 'value'))
        }

        return this.unify(elementIdClearCommands)
    })
}

export default clearElement
