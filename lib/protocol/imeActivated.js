/**
 *
 * Indicates whether IME input is active at the moment (not if it's available).
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @return {boolean}  true if IME input is available and currently active, false otherwise
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimeactivated
 * @type protocol
 * @deprecated
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function imeActivated () {
    deprecate('imeActivated', this.options)
    return this.requestHandler.create('/session/:sessionId/ime/activated')
}
