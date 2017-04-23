/**
 *
 * Move the mouse by an offset of the specificed element. If no element is specified,
 * the move is relative to the current mouse cursor. If an element is provided but
 * no offset, the mouse will be moved to the center of the element. If the element
 * is not visible, it will be scrolled into view.
 *
 * (Not part of the official Webdriver specification).
 *
 * @param {String} element  Opaque ID assigned to the element to move to, as described in the WebElement JSON Object. If not specified or is null, the offset is relative to current position of the mouse.
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidmoveto
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import eventSimulator from '../scripts/eventSimulator'
import depcrecateCommand from '../helpers/depcrecationWarning'

export default function moveTo (element, xoffset, yoffset) {
    let data = {}

    if (typeof element === 'string') {
        data.element = element
    }

    if (typeof xoffset === 'number') {
        data.xoffset = xoffset
    }

    if (typeof yoffset === 'number') {
        data.yoffset = yoffset
    }

    /**
     * if no attribute is set, throw error
     */
    if (Object.keys(data).length === 0) {
        throw new ProtocolError('number or type of arguments don\'t agree with moveTo command')
    }

    depcrecateCommand('moveTo')

    /**
     * simulate event in safari
     */
    if (this.desiredCapabilities.browserName === 'safari') {
        xoffset = xoffset || 0
        yoffset = yoffset || 0

        let target = { x: xoffset, y: yoffset }
        return this.elementIdLocation(element).then((res) => {
            target = { x: res.value.x + xoffset, y: res.value.y + yoffset }
        }).execute(eventSimulator).execute((elem, x, y) => {
            return window._wdio_simulate(elem, 'mousemove', x, y)
        }, { ELEMENT: element }, target.x, target.y)
    }

    return this.requestHandler.create('/session/:sessionId/moveto', data)
}
