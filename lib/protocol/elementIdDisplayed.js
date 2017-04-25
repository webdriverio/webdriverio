/**
 *
 * Determine if an element is currently displayed.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @return {Boolean} true if the element is displayed
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#element-displayedness
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function elementIdDisplayed (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdDisplayed protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/displayed`)
}
