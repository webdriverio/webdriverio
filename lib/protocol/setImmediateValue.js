/**
 *
 * Set immediate value in app.
 *
 * <example>
    :setImmediateValueId.js
    browser.setImmediateValue(42, 'foo')

    :setImmediateValueSelector.js
    browser.setImmediateValue('~myInput', 'foo')
 * </example>
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

    /**
     * recursively call the method with the retrived element id when a non-number is passed
     */
    if (isNaN(id)) {
        return this.element(id).then((elem) => this.setImmediateValue(elem.value.ELEMENT, value))
    }

    return this.requestHandler.create({
        path: `/session/:sessionId/appium/element/${id}/value`,
        method: 'POST'
    }, { value })
}

export default setImmediateValue
