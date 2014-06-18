/**
 * protocol bindings for all frame parent operation
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

    this.requestHandler.create(requestOptions,arguments[arguments.length - 1]);

};