/**
 *
 * Query for an element's tag name.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @return {String}  the element's tag name, as a lowercase string
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#get-element-tag-name
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function elementIdName (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdName protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/name`)
}
