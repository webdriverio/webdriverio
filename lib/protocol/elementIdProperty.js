/**
 *
 * Get the value of an element's property.
 *
 * @param {String} ID             ID of a WebElement JSON object to route the command to
 * @param {String} propertyName  property name of element you want to receive
 *
 * @return {String|null} The value of the property, or null if it is not set on the element.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-element-property
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import { isUnknownCommand } from '../helpers/utilities'

export default function elementIdProperty (id, propertyName) {
    if ((typeof id !== 'string' && typeof id !== 'number') || typeof propertyName !== 'string') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdProperty protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/property/${propertyName}`).catch((err) => {
        /**
         * use old path if W3C path failed
         */
        if (isUnknownCommand(err)) {
            return this.elementIdAttribute(id, propertyName)
        }

        throw err
    })
}
