/**
 *
 * Finger down on the screen. Depcrecated! Please use `touchPerform` instead.
 *
 * @param {Number} x  X coordinate on the screen
 * @param {Number} y  Y coordinate on the screen
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtouchdown
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function touchDown (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchDown command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/down', { x, y })
}
