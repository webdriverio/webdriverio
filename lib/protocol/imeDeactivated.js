/**
 *
 * De-activates the currently-active IME engine. (Not part of the official Webdriver specification)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimedeactivate
 * @type protocol
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function imeDeactivated () {
    deprecate('imeDeactivated', this.options)
    return this.requestHandler.create('/session/:sessionId/ime/deactivated')
}
