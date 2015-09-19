/**
 *
 * Indicates whether IME input is active at the moment (not if it's available).
 *
 * @returns {boolean}  true if IME input is available and currently active, false otherwise
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/activated
 * @type protocol
 *
 */

let imeActivated = function () {
    return this.requestHandler.create(
        '/session/:sessionId/ime/activated'
    )
}

export default imeActivated
