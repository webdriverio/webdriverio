/**
 *
 * Get tag name of a DOM-element found by given selector.
 *
 * <example>
    :index.html
    <div id="elem">Lorem ipsum</div>

    :getTagName.js
    client.getTagName('#elem').then(function(tagName) {
        console.log(tagName); // outputs: "div"
    });
 * </example>
 *
 * @param   {String}           selector   element with requested tag name
 * @returns {String|String[]}             the element's tag name, as a lowercase string
 *
 * @uses protocol/elements, protocol/elementIdName
 * @type property
 *
 */

var Q = require('q'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getTagName (selector) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdNameCommands = [];

        res.value.forEach(function(elem) {
            elementIdNameCommands.push(self.elementIdName(elem.ELEMENT));
        });

        return Q.all(elementIdNameCommands);

    }).then(function(tagNames) {

        tagNames = tagNames.map(function(tagName) {
            return tagName.value.toLowerCase();
        });

        return tagNames.length === 1 ? tagNames[0] : tagNames;

    });

};
