/**
 *
 * Get available log types. This command is not part of the official Webdriver specification. Therefor the
 * result can vary depending on the capability you are runnint the test.
 *
 * <example>
    :logTypes.js
    it('demonstrate all available log types', function () {
        var logTypes = browser.logTypes();
        console.log(logTypes); // outputs: ['browser', 'driver', 'client', 'server']
    });
 * </example>
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
