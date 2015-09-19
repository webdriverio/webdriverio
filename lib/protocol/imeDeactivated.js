/**
 *
 * De-activates the currently-active IME engine.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/deactivated
 * @type protocol
 *
 */

let imeDeactivated = function () {
    return this.requestHandler.create('/session/:sessionId/ime/deactivated')
}

export default imeDeactivated
