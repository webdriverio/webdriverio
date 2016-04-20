/**
 *
 * Get the name of the active IME engine. The name string is platform specific. (Not part of the
 * official Webdriver specification)
 *
 * @returns {String} engine   The name of the active IME engine.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimeactive_engine
 * @type protocol
 *
 */

let imeActiveEngine = function () {
    return this.requestHandler.create('/session/:sessionId/ime/active_engine')
}

export default imeActiveEngine
