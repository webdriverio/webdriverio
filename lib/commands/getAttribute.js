/**
 *
 * Get an attribute from an DOM-element based on the selector and attribute name.
 * Returns a list of attribute values if selector matches multiple elements.
 *
 * <example>
    :index.html
    <div data-type="example" id="elem">
        Lorem ipsum dolor ammet
    </div>

    :getAttribute.js
    client.getAttribute('#elem', 'data-type').then(function(attr) {
        console.log(attr); // outputs: "example"
    });
 * </example>
 *
 * @param {String} selector      element with requested attribute
 * @param {String} attributeName requested attribute
 *
 * @returns {String|String[]|null} The value of the attribute(s), or null if it is not set on the element.
 *
 * @uses protocol/elements, protocol/elementIdAttribute
 * @type property
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getAttribute (selector, attributeName) {

    /*!
     * parameter check
     */
    if(typeof attributeName !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with getAttribute command');
    }

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdAttributeCommands = [];

        res.value.forEach(function(elem) {
            elementIdAttributeCommands.push(self.elementIdAttribute(elem.ELEMENT, attributeName));
        });

        return this.unify(elementIdAttributeCommands, {
            extractValue: true
        });

    });

};
