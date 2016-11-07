/**
 *
 * Get tag name of a DOM-element found by given selector.
 *
 * <example>
    :index.html
    <div id="elem">Lorem ipsum</div>

    :getTagName.js
    it('should demonstrate the getTagName command', function () {
        var elem = $('#elem');

        var tagName = elem.getTagName();
        console.log(tagName); // outputs: "div"
    })
 * </example>
 *
 * @alias browser.getTagName
 * @param   {String}           selector   element with requested tag name
 * @returns {String|String[]}             the element's tag name, as a lowercase string
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
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        let elementIdNameCommands = []
        for (let elem of res.value) {
            elementIdNameCommands.push(this.elementIdName(elem.ELEMENT))
        }

        return this.unify(elementIdNameCommands, {
            extractValue: true
        })
    })
}

export default getTagName
