/**
 *
 * Get available log types. (Not part of the official Webdriver specification).
 *
 * @returns {Strings[]}  The list of available [log types](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#log-type)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidlogtypes
 * @type protocol
 *
 */

let logTypes = function () {
    return this.requestHandler.create('/session/:sessionId/log/types')
}

export default logTypes
