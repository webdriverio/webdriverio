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

    :isSelected.js
    client.isSelected('[value="Layla Terry"]').then(function(isSelected) {
        console.log(isSelected); // outputs: true
    });
 * </example>
 *
 * @param   {String}             selector  option element or input of type checkbox or radio
 * @returns {Boolean|Boolean[]}            true if element is selected
 *
 * @uses protocol/elements, protocol/elementIdSelected
 * @type state
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function isSelected (selector) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdSelectedCommands = [];

        res.value.forEach(function(elem) {
            elementIdSelectedCommands.push(self.elementIdSelected(elem.ELEMENT));
        });

        return this.unify(elementIdSelectedCommands, {
            extractValue: true
        });

    });

};