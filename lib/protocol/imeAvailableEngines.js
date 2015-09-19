/**
 *
 * List all available engines on the machine. To use an engine, it has to be present
 * in this list.
 *
 * @returns {Object[]} engines   A list of available engines
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/available_engines
 * @type protocol
 *
 */

let imeAvailableEngines = function () {
    return this.requestHandler.create('/session/:sessionId/ime/available_engines')
}

export default imeAvailableEngines
