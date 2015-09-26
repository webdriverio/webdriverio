/**
 *
 * Get available log types.
 *
 * @returns {Strings[]}  The list of available [log types](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Log_Type)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/log/types
 * @type protocol
 *
 */

let logTypes = function () {
    return this.requestHandler.create('/session/:sessionId/log/types')
}

export default logTypes
