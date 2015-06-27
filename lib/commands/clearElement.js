/**
 *
 * Clear a `<textarea>` or text `<input>` element’s value.
 *
 * <example>
    :clearElement.js
    client
        .setValue('.input', 'test123')
        .clearElement('.input')
        .getValue('.input').then(function(value) {
            assert(value === ''); // true
        });
 * </example>
 *
 * @param {String} selector input element
 *
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function clearElement (selector) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdClearCommands = [];

        res.value.forEach(function(elem) {
            elementIdClearCommands.push(self.elementIdClear(elem.ELEMENT, 'value'));
        });

        return this.unify(elementIdClearCommands);

    });

};