/**
 *
 * De-activates the currently-active IME engine.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimedeactivate
 * @type protocol
 * @deprecated
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function imeDeactivated () {
    deprecate('imeDeactivated', this.options)
    return this.requestHandler.create('/session/:sessionId/ime/deactivated')
}
