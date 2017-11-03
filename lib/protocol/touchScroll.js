/**
 * Scroll on the touch screen using finger based motion events. If
 * element ID is given start scrolling at a particular screen location.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors. Please use the
 * [`touchPerform`](http://webdriver.io/api/mobile/touchPerform.html) command instead.
 *
 * @param {String} id       the element where the scroll starts.
 * @param {Number} xoffset  in pixels to scroll by
 * @param {Number} yoffset  in pixels to scroll by
 *
 * @see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtouchscroll
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import deprecate from '../helpers/deprecationWarning'

export default function touchScroll (id, xoffset, yoffset) {
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

    deprecate(
        'touchScroll',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. It is recommended to use the touchAction command for this.'
    )

    return this.requestHandler.create('/session/:sessionId/touch/scroll', data)
}
