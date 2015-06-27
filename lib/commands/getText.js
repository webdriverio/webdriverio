/**
 *
 * Get the text content from a DOM-element found by given selector.
 *
 * <example>
    :index.html
    <div id="elem">
        Lorem ipsum <strong>dolor</strong> sit amet,<br>
        consetetur sadipscing elitr
    </div>

    :getText.js
    client.getText('#elem').then(function(text) {
        console.log(text);
        // outputs the following:
        // "Lorem ipsum dolor sit amet,consetetur sadipscing elitr"
    });
 * </example>
 *
 * @param   {String}           selector   element with requested text
 * @returns {String|String[]}             content of selected element (all HTML tags are removed)
 *
 * @uses protocol/elements, protocol/elementIdText
 * @type property
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getText (selector) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdTextCommands = [];

        res.value.forEach(function(elem) {
            elementIdTextCommands.push(self.elementIdText(elem.ELEMENT));
        });

        return this.unify(elementIdTextCommands, {
            extractValue: true
        });

    });

};