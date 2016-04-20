/**
 *
 * Query the value of an element's computed CSS property. The CSS property to query
 * should be specified using the CSS property name, not the JavaScript property name
 * (e.g. background-color instead of backgroundColor).
 *
 * @param {String} ID                ID of a WebElement JSON object to route the command to
 * @param  {String} cssPropertyName  CSS property
 *
 * @returns {String} The value of the specified CSS property.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-element-property
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let elementIdCssProperty = function (id, cssPropertyName) {
    if ((typeof id !== 'string' && typeof id !== 'number') || typeof cssPropertyName !== 'string') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdCssProperty protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/css/${cssPropertyName}`)
}

export default elementIdCssProperty
