/**
 *
 * Long press on the touch screen using finger motion events. Deprecated! Please use `touchPerform` instead.
 *
 * @param {String} id ID of the element to long press on
 *
 * @see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtouchlongclick
 * @type protocol
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function touchLongClick (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchLongClick protocol command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/longclick', {
        element: id.toString()
    })
}
