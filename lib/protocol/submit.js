/**
 *
 * Submit a FORM element. The submit command may also be applied to any element
 * that is a descendant of a FORM element.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @param {String} ID ID of a `<form />` WebElement JSON object to route the command to
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidsubmit
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import deprecate from '../helpers/deprecationWarning'

export default function submit (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError(
            'number or type of arguments don\'t agree with submit protocol command'
        )
    }

    deprecate('submit', this.options)
    return this.requestHandler.create({
        path: `/session/:sessionId/element/${id}/submit`,
        method: 'POST'
    }, {dummy: 'dummy'})
}
