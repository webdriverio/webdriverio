/**
 *
 * Submit a FORM element. The submit command may also be applied to any element
 * that is a descendant of a FORM element. (Not part of the official Webdriver specification).
 *
 * @param {String} ID ID of a `<form />` WebElement JSON object to route the command to
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidsubmit
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import depcrecate from '../helpers/depcrecationWarning'

export default function submit (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError(
            'number or type of arguments don\'t agree with submit protocol command'
        )
    }

    depcrecate('submit')
    return this.requestHandler.create({
        path: `/session/:sessionId/element/${id}/submit`,
        method: 'POST'
    })
}
