/**
 *
 * Finger down on the screen.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors. Please use the
 * [`touchPerform`](http://webdriver.io/api/mobile/touchPerform.html) command instead.
 *
 * @param {Number} x  X coordinate on the screen
 * @param {Number} y  Y coordinate on the screen
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidtouchdown
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import deprecate from '../helpers/deprecationWarning'

export default function touchDown (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with touchDown command')
    }

    deprecate(
        'touchDown',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. It is recommended to use the touchAction command for this.'
    )

    return this.requestHandler.create('/session/:sessionId/touch/down', { x, y })
}
