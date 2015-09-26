/**
 *
 * Finger move on the screen.
 *
 * @param {Number} x  coordinate on the screen
 * @param {Number} y  coordinate on the screen
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/move
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let touchMove = function (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchMove command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/move', { x, y })
}

export default touchMove
