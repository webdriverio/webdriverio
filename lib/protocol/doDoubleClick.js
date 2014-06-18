/**
 *
 * Double-clicks at the current mouse coordinates (set by moveto).
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/doubleclick
 * @type protocol
 *
 */

module.exports = function doDoubleClick () {

    var requestOptions = {
        path: '/session/:sessionId/doubleclick',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, arguments[arguments.length - 1]);

};
