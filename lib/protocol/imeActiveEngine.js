/**
 *
 * Get the name of the active IME engine. The name string is platform specific. (Not part of the
 * official Webdriver specification)
 *
 * @return {String} engine   The name of the active IME engine.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimeactive_engine
 * @type protocol
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function imeActiveEngine () {
    deprecate('imeActiveEngine')
    return this.requestHandler.create('/session/:sessionId/ime/active_engine')
}
