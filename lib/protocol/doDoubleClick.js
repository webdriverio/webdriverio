/**
 *
 * Double-clicks at the current mouse coordinates (set by moveto. (Not part of the official Webdriver specification).
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessioniddoubleclick
 * @type protocol
 *
 */

let doDoubleClick = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/doubleclick',
        method: 'POST'
    })
}

export default doDoubleClick
