/**
 *
 * Perform touch action
 *
 * @param {Object} touchAttr contains attributes of touch gesture (e.g. `element`, `x` and `y`)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#touchaction--multitouchaction
 * @type mobile
 * @for android, ios
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function performTouchAction (action) {
    if (typeof action !== 'object') {
        throw new ProtocolError('number or type of arguments don\'t agree with performTouchAction protocol command')
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/touch/perform',
        method: 'POST'
    }, action)
}
