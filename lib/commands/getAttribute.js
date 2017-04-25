/**
 *
 * Get an attribute from an DOM-element based on the selector and attribute name.
 * Returns a list of attribute values if selector matches multiple elements.
 *
 * <example>
    :index.html
    <form action="/submit" method="post" class="loginForm">
        <input type="text" name="name" placeholder="username"></input>
        <input type="text" name="password" placeholder="password"></input>
        <input type="submit" name="submit" value="submit"></input>
    </form>

    :getAttribute.js
    it('should demonstrate the getAttribute command', function () {
        var form = $('form')

        var attr = form.getAttribute('method')
        console.log(attr) // outputs: "post"
        // or
        console.log(browser.getAttribute('form', 'method')) // outputs: "post"

        // if your selector matches multiple elements it returns an array of results
        var allInputs = $$('.loginForm input')
        console.log(allInputs.map(function(el) { return el.getAttribute('name'); })) // outputs: ['name', 'password', 'submit']
    })
 * </example>
 *
 * @alias browser.getAttribute
 * @param {String} selector      element with requested attribute
 * @param {String} attributeName requested attribute
 * @return {String|String[]|null} The value of the attribute(s), or null if it is not set on the element.
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
            throw new CommandError(7, selector || this.lastResult.selector)
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
