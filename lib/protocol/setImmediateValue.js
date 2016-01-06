/**
 *
 * Set immediate value in app.
 *
 * <example>
    :setImmediateValue.js
    client.setImmediateValue(el, 'foo')
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let setImmediateValue = function (id, value) {
    if (typeof id !== 'string' || typeof id !== 'number') {
        throw new ProtocolError('setImmediateValue requires two parameters (id, value) from type string')
    }

    return this.requestHandler.create({
        path: `/session/:sessionId/appium/element/${id}/value`,
        method: 'POST'
    }, { value })
}

export default setImmediateValue
