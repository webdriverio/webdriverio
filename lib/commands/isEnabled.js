/**
 *
 * Return true or false if the selected DOM-element found by given selector is enabled.
 *
 * <example>
    :index.html
    <input type="text" name="inputField" class="input1">
    <input type="text" name="inputField" class="input2" disabled>
    <input type="text" name="inputField" class="input3" disabled="disabled">

    :isEnabled.js
    it('should detect if an element is enabled', function () {
        var isEnabled = browser.isEnabled('.input1');
        console.log(isEnabled); // outputs: true

        var isEnabled2 = browser.isEnabled('.input2');
        console.log(isEnabled2); // outputs: false

        var isEnabled3 = browser.isEnabled('.input3')
        console.log(isEnabled3); // outputs: false
    });
 * </example>
 *
 * @alias browser.isEnabled
 * @param   {String}             selector  DOM-element
 * @return {Boolean|Boolean[]}            true if element(s)* (is|are) enabled
 * @uses protocol/elements, protocol/elementIdEnabled
 * @type state
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let isEnabled = function (selector) {
    return this.elements(selector).then((res) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        let elementIdEnabledCommands = []
        for (let elem of res.value) {
            elementIdEnabledCommands.push(this.elementIdEnabled(elem.ELEMENT))
        }

        return this.unify(elementIdEnabledCommands, {
            extractValue: true
        })
    })
}

export default isEnabled
