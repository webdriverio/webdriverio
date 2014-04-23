/**
 * https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/location
 */

module.exports = function location (args, callback) {
    var data = {};

    if (typeof args === 'function') {
        callback = args;
        data = {};
    }

    this.requestHandler.create(
        '/session/:sessionId/location',
        data,
        callback
    );
};

