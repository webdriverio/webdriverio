/**
 *
 * De-activates the currently-active IME engine. (Not part of the official Webdriver specification)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimedeactivate
 * @type protocol
 *
 */

import depcrecate from '../helpers/depcrecationWarning'

export default function imeDeactivated () {
    depcrecate('imeDeactivated')
    return this.requestHandler.create('/session/:sessionId/ime/deactivated')
}
