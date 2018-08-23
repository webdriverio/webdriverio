/**
 *
 * Get the value of a `<textarea>`, `<select>` or text `<input>` found by given selector.
 * If multiple elements are found via the given selector, an array of values is returned instead.
 *
 * <example>
    :index.html
    <input type="text" value="John Doe" id="username">

    :getValue.js
    it('should demonstrate the getValue command', function () {
        var inputUser = $('#username');

        var value = inputUser.getValue();
        console.log(value); // outputs: "John Doe"
    });
 * </example>
 *
 * @alias browser.getValue
 * @param   {String} selector input, textarea, or select element
 * @return {String|String[]}          requested element(s) value
 * @uses protocol/elements, protocol/elementIdProperty
 * @type property
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let getValue = function (selector) {
    return this.elements(selector).then((res) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        let elementIdPropertyCommands = []
        for (let elem of res.value) {
            elementIdPropertyCommands.push(this.elementIdProperty(elem.ELEMENT, 'value'))
        }

        return this.unify(elementIdPropertyCommands, {
            extractValue: true
        })
    })
}

export default getValue
