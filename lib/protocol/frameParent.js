/**
 * Change focus to the parent context. If the current context is the top level browsing context,
 * the context remains unchanged.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame/parent
 * @type protocol
 *
 */

module.exports = function frameParent () {

    var requestOptions = {
        path: '/session/:sessionId/frame/parent',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};