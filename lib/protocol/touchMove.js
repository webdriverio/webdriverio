/**
 *
 * Finger move on the screen. Deprecated! Please use `touchPerform` instead.
 * Deprecated! Please use `touchPerform` instead.
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 *
 * @see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtouchmove
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function touchMove (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchMove command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/move', { x, y })
}
