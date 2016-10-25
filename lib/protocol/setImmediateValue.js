/**
 *
 * Set immediate value in app.
 *
 * <example>
    :setImmediateValue.js
    browser.setImmediateValue(el, 'foo')
 * </example>
 *
 * @param {String} ID              ID of a WebElement JSON object to route the command to
 * @param {String|String[]} value  The sequence of keys to type. An array must be provided. The server should flatten the array items to a single string to be typed.
 *
 * @type mobile
 * @for ios
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let setImmediateValue = function (id, value) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('setImmediateValue requires two parameters (id, value) from type string')
    }

    return this.requestHandler.create({
        path: `/session/:sessionId/appium/element/${id}/value`,
        method: 'POST'
    }, { value })
}

export default setImmediateValue
