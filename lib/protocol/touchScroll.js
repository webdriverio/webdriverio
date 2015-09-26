/**
 * Scroll on the touch screen using finger based motion events. If
 * element ID is given start scrolling at a particular screen location.
 *
 * @param {String} id       the element where the scroll starts.
 * @param {Number} xoffset  in pixels to scroll by
 * @param {Number} yoffset  in pixels to scroll by
 *
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#session/:sessionId/touch/scroll
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let touchScroll = function (id, xoffset, yoffset) {
    let data = {}

    /*!
     * start scrolling at a particular screen location
     */
    if (arguments.length === 3 && id && typeof xoffset === 'number' && typeof yoffset === 'number') {
        data = { element: id, xoffset, yoffset }

    /*!
     * if you don't care where the scroll starts on the screen
     */
    } else if (arguments.length === 3 && !id && typeof xoffset === 'number' && typeof yoffset === 'number') {
        data = { xoffset, yoffset }

    /*!
     * if you don't care where the scroll starts on the screen
     */
    } else if (arguments.length === 2 && typeof id === 'number' && typeof xoffset === 'number') {
        data = {
            xoffset: id,
            yoffset: xoffset
        }
    } else {
        throw new ProtocolError('number or type of arguments don\'t agree with touchScroll command')
    }

    return this.requestHandler.create('/session/:sessionId/touch/scroll', data)
}

export default touchScroll
