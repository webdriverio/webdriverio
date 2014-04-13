/**
 * https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/location
 */

module.exports = function location (location, callback) {
    var data = {};

    if (typeof location === 'function') {
        callback = location;
        data = {};
    }

    this.requestHandler.create(
        '/session/:sessionId/location',
        data,
        callback
    );
};

