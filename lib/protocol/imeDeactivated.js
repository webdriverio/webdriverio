/**
 *
 * De-activates the currently-active IME engine. (Not part of the official Webdriver specification)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidimedeactivate
 * @type protocol
 *
 */

let imeDeactivated = function () {
    return this.requestHandler.create('/session/:sessionId/ime/deactivated')
}

export default imeDeactivated
