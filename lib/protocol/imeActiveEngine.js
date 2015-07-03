/**
 *
 * Get the name of the active IME engine. The name string is platform specific.
 *
 * @returns {String} engine   The name of the active IME engine.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/active_engine
 * @type protocol
 *
 */

module.exports = function imeActiveEngine () {

    return this.requestHandler.create(
        '/session/:sessionId/ime/active_engine'
    );

};