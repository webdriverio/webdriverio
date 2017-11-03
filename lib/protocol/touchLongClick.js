/**
 *
 * Long press on the touch screen using finger motion events.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors. Please use the
 * [`touchPerform`](http://webdriver.io/api/mobile/touchPerform.html) command instead.
 *
 * @param {String} id ID of the element to long press on
 *
 * @see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtouchlongclick
 * @type protocol
 * @for android
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import deprecate from '../helpers/deprecationWarning'

export default function touchLongClick (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchLongClick protocol command')
    }

    deprecate(
        'touchLongClick',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. It is recommended to use the touchAction command for this.'
    )

    return this.requestHandler.create('/session/:sessionId/touch/longclick', {
        element: id.toString()
    })
}
