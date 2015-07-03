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
    client
        .isEnabled('.input1').then(function(isEnabled) {
            console.log(isEnabled); // outputs: true
        })
        .isEnabled('.input2').then(function(isEnabled) {
            console.log(isEnabled); // outputs: false
        })
        .isEnabled('.input3').then(function(isEnabled) {
            console.log(isEnabled); // outputs: false
        })
 * </example>
 *
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* (is|are) enabled
 *
 * @uses protocol/elements, protocol/elementIdEnabled
 * @type state
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function isEnabled (selector) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdEnabledCommands = [];

        res.value.forEach(function(elem) {
            elementIdEnabledCommands.push(self.elementIdEnabled(elem.ELEMENT));
        });

        return this.unify(elementIdEnabledCommands, {
            extractValue: true
        });

    });

};