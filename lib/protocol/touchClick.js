/**
 *
 * Single tap on the touch enabled device.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/click
 * @type protocol
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let touchClick = function (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdCssProperty protocol command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/click', {
        element: id.toString()
    })
}

export default touchClick
