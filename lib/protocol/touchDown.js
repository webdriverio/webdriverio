/**
 *
 * Finger down on the screen.
 *
 * @param {Number} x  X coordinate on the screen
 * @param {Number} y  Y coordinate on the screen
 *
 * @see  http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/touch/down
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let touchDown = function (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchDown command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/down', {
        x: x,
        y: y
    })
}

export default touchDown
