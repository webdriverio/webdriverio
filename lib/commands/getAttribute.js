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

    :getAttributeAsync.js
    client.getAttribute('#elem', 'data-type').then(function(attr) {
        console.log(attr); // outputs: "example"
    });

    :getAttributeSync.js
    it('should demonstrate the getAttribute command', function () {
        var elem = browser.element('#elem');

        var attr = elem.getAttribute('data-type');
        console.log(attr); // outputs: "example"

        console.log(browser.getAttribute('#elem', 'data-type')); // outputs: "example"

        // if your selector matches multiple elements it returns an array of results
        var multipleElements = browser.elements('.loginForm input');
        console.log(multipleElements..getAttribute('name')); // outputs: ['name', 'password']
    });
 * </example>
 *
 * @alias browser.getAttribute
 * @param {String} selector      element with requested attribute
 * @param {String} attributeName requested attribute
 * @returns {String|String[]|null} The value of the attribute(s), or null if it is not set on the element.
 * @uses protocol/elements, protocol/elementIdAttribute
 * @type property
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let getAttribute = function (selector, attributeName) {
    /*!
     * parameter check
     */
    if (typeof attributeName !== 'string') {
        throw new CommandError('number or type of arguments don\'t agree with getAttribute command')
    }

    return this.elements(selector).then((res) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7)
        }

        let elementIdAttributeCommands = []

        for (let elem of res.value) {
            elementIdAttributeCommands.push(this.elementIdAttribute(elem.ELEMENT, attributeName))
        }

        return this.unify(elementIdAttributeCommands, {
            extractValue: true
        })
    })
}

export default getAttribute
