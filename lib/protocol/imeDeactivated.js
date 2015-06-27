/**
 *
 * De-activates the currently-active IME engine.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/deactivated
 * @type protocol
 *
 */

module.exports = function imeDeactivated () {

    return this.requestHandler.create(
        '/session/:sessionId/ime/deactivated'
    );

};