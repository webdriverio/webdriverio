/**
 *
 * Double tap on the touch screen using finger motion events.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/doubleclick
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let touchDoubleClick = function (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchDoubleClick protocol command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/doubleclick', {
        element: id.toString()
    })
}

export default touchDoubleClick
