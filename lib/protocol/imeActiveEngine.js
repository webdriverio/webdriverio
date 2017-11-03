/**
 *
 * Get the name of the active IME engine. The name string is platform specific.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @return {String} engine   The name of the active IME engine.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimeactive_engine
 * @type protocol
 * @deprecated
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function imeActiveEngine () {
    deprecate(
        'imeActiveEngine',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. There is currently no known replacement for this ' +
        'action.'
    )
    return this.requestHandler.create('/session/:sessionId/ime/active_engine')
}
