/**
 *
 * Get the text content from a DOM-element found by given selector. Make sure the element
 * you want to request the text from [is interactable](http://www.w3.org/TR/webdriver/#interactable)
 * otherwise you will get an empty string as return value. If the element is disabled or not
 * visible and you still want to receive the text content use [getHTML](http://webdriver.io/api/property/getHTML.html)
 * as a workaround.
 *
 * <example>
    :index.html
    <div id="elem">
        Lorem ipsum <strong>dolor</strong> sit amet,<br>
        consetetur sadipscing elitr
    </div>
    &nbsp;
    <span style="display: none">I am invisible</span>

    :getText.js
    client.getText('#elem').then(function(text) {
        console.log(text);
        // outputs the following:
        // "Lorem ipsum dolor sit amet,consetetur sadipscing elitr"
    })
    .getText('span').then(function(text) {
        console.log(text);
        // outputs "" (empty string) since element is not interactable
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