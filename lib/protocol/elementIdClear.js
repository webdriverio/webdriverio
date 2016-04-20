/**
 *
 * Clear a `TEXTAREA` or text `INPUT element's value.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-element-clear
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let elementIdClear = function (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdClear protocol command')
    }

    return this.requestHandler.create({
        path: `/session/:sessionId/element/${id}/clear`,
        method: 'POST'
    })
}

export default elementIdClear
