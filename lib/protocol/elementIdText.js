/**
 *
 * Returns the visible text for the element.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {String} visible text for the element
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/text
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let elementIdText = function (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdText protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/text`)
}

export default elementIdText
