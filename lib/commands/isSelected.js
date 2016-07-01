/**
 *
 * Return true or false if an `<option>` element, or an `<input>` element of type
 * checkbox or radio is currently selected found by given selector.
 *
 * <example>
    :index.html
    <select name="selectbox" id="selectbox">
        <option value="John Doe">John Doe</option>
        <option value="Layla Terry" selected="selected">Layla Terry</option>
        <option value="Bill Gilbert">Bill Gilbert"</option>
    </select>

    :isSelectedAsync.js
    client.isSelected('[value="Layla Terry"]').then(function(isSelected) {
        console.log(isSelected); // outputs: true
    });

    :isSelectedSync.js
    it('should demonstrate the isSelected command', function () {
        var element = browser.element('[value="Layla Terry"]');
        console.log(element.isSelected()); // outputs: true
    });
 * </example>
 *
 * @alias browser.isSelected
 * @param   {String}             selector  option element or input of type checkbox or radio
 * @returns {Boolean|Boolean[]}            true if element is selected
 * @uses protocol/elements, protocol/elementIdSelected
 * @type state
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let isSelected = function (selector) {
    return this.elements(selector).then((res) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7)
        }

        let elementIdSelectedCommands = []
        for (let elem of res.value) {
            elementIdSelectedCommands.push(this.elementIdSelected(elem.ELEMENT))
        }

        return this.unify(elementIdSelectedCommands, {
            extractValue: true
        })
    })
}

export default isSelected
