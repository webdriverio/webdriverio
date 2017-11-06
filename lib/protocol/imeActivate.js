/**
 *
 * Make an engines that is available (appears on the list returned by getAvailableEngines) active.
 * After this call, the engine will be added to the list of engines loaded in the IME daemon and the
 * input sent using sendKeys will be converted by the active engine. Note that this is a
 * platform-independent method of activating IME (the platform-specific way being using keyboard shortcuts.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @param {String} engine   Name of the engine to activate.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimeactive_engine
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import deprecate from '../helpers/deprecationWarning'

export default function imeActivate (engine) {
    if (typeof engine !== 'string') {
        throw new ProtocolError('number or type of arguments don\'t agree with imeActivate protocol command')
    }

    deprecate(
        'imeActivate',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. There is currently no known replacement for this ' +
        'action.'
    )
    return this.requestHandler.create('/session/:sessionId/ime/activate', { engine })
}
