/**
 *
 * The Take Element Screenshot command takes a screenshot of the visible region encompassed
 * by the bounding rectangle of an element. If given a parameter argument scroll that
 * evaluates to false, the element will not be scrolled into view.
 *
 * @return {String} screenshot   The screenshot as a base64 encoded PNG.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#take-screenshot
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function elementIdScreenshot (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError(
            'number or type of arguments don\'t agree with elementIdScreenshot protocol command'
        )
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/screenshot`)
}
