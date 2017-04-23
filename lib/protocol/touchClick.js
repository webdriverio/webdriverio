/**
 *
 * Single tap on the touch enabled device. Depcrecated! Please use `touchPerform` instead.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 *
 * @see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtouchclick
 * @type protocol
 * @for android
 * @depcrecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function touchClick (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdCssProperty protocol command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/click', {
        element: id.toString()
    })
}
