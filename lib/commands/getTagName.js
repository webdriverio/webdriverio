/**
 *
 * Get tag name of a DOM-element found by given selector.
 *
 * <example>
    :index.html
    <div id="elem">Lorem ipsum</div>

    :getTagNameAsync.js
    client.getTagName('#elem').then(function(tagName) {
        console.log(tagName); // outputs: "div"
    });

    :getTagNameSync.js
    it('should demonstrate the getTagName command', function () {
        var elem = browser.element('#elem');

        var tagName = elem.getTagName();
        console.log(tagName); // outputs: "div"
    })
 * </example>
 *
 * @param   {String}           selector   element with requested tag name
 * @returns {String|String[]}             the element's tag name, as a lowercase string
 *
 * @uses protocol/elements, protocol/elementIdName
 * @type property
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let getTagName = function (selector) {
    return this.elements(selector).then((res) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7)
        }

        let elementIdNameCommands = []
        for (let elem of res.value) {
            elementIdNameCommands.push(this.elementIdName(elem.ELEMENT))
        }

        return Promise.all(elementIdNameCommands)
    }).then((tagNames) => {
        tagNames = tagNames.map((tagName) => tagName.value.toLowerCase())
        return tagNames.length === 1 ? tagNames[0] : tagNames
    })
}

export default getTagName
