/**
 *
 * set immediate value in app
 *
 * <example>
    :setImmediateValueInApp.js
    client.setImmediateValueInApp(id, value)
 * </example>
 *
 * @type appium
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let setImmediateValueInApp = function (id, value) {
    if ((typeof id !== 'string' && typeof id !== 'number') || typeof value === 'function') {
        throw new ProtocolError('number or type of arguments don\'t agree with setImmediateValueInApp protocol command')
    }

    return this.requestHandler.create({
        path: `/session/:sessionId/appium/element/${id}/value`,
        method: 'POST'
    }, {
        value: value
    })
}

export default setImmediateValueInApp
