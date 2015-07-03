/**
 *
 * Get the value of a `<textarea>` or text `<input>` found by given selector.
 *
 * <example>
    :index.html
    <input type="text" value="John Doe" id="username">

    :getValue-with-promises.js
    client.getValue('#username').then(function(value) {
        console.log(value); // outputs: "John Doe"
    });

    :getValue-with-callbacks.js
    client.getValue('#username', function(err, value) {
        console.log(value); // outputs: "John Doe"
    });
 * </example>
 *
 * @param   {String} selector input or textarea element
 * @returns {String}          requested input value
 *
 * @uses protocol/elements, protocol/elementIdAttribute
 * @type property
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getValue (selector) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            return new ErrorHandler(7);
        }

        var self = this,
            elementIdAttributeCommands = [];

        res.value.forEach(function(elem) {
            elementIdAttributeCommands.push(self.elementIdAttribute(elem.ELEMENT, 'value'));
        });

        return this.unify(elementIdAttributeCommands, {
            extractValue: true
        });

    });

};