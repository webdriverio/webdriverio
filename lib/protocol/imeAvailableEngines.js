/**
 *
 * List all available engines on the machine. To use an engine, it has to be present
 * in this list. (Not part of the official Webdriver specification)
 *
 * @return {Object[]} engines   A list of available engines
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimeavailable_engines
 * @type protocol
 *
 */

import depcrecate from '../helpers/depcrecationWarning'

export default function imeAvailableEngines () {
    depcrecate('imeAvailableEngines')
    return this.requestHandler.create('/session/:sessionId/ime/available_engines')
}
