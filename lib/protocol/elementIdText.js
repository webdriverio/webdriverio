/**
 *
 * Returns the visible text for the element.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @return {String} visible text for the element
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#getelementtext
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function elementIdText (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdText protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/text`)
}
