/**
 *
 * List all available engines on the machine. To use an engine, it has to be present
 * in this list.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @return {Object[]} engines   A list of available engines
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimeavailable_engines
 * @type protocol
 * @deprecated
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function imeAvailableEngines () {
    deprecate(
        'imeAvailableEngines',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. There is currently no known replacement for this ' +
        'action.'
    )
    return this.requestHandler.create('/session/:sessionId/ime/available_engines')
}
