/**
 *
 * Get the value of an element's attribute.
 *
 * @param {String} ID             ID of a WebElement JSON object to route the command to
 * @param {String} attributeName  attribute name of element you want to receive
 *
 * @returns {String|null} The value of the attribute, or null if it is not set on the element.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/attribute/:name
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let elementIdAttribute = function (id, attributeName) {
    if ((typeof id !== 'string' && typeof id !== 'number') || typeof attributeName !== 'string') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdAttribute protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/attribute/${attributeName}`)
}

export default elementIdAttribute
