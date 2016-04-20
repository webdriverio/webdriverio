/**
 *
 * Determine if an OPTION element, or an INPUT element of type checkbox or
 * radiobutton is currently selected.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @returns {Boolean} true if the element is selected.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-is-element-selected
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let elementIdSelected = function (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdSelected protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/selected`)
}

export default elementIdSelected
