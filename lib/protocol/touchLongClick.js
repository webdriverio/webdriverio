/**
 *
 * Long press on the touch screen using finger motion events.
 *
 * @param {String} id ID of the element to long press on
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/longclick
 * @type protocol
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let touchLongClick = function (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchLongClick protocol command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/longclick', {
        element: id.toString()
    })
}

export default touchLongClick
