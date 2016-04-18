/**
 *
 * Protocol bindings for all geolocation operations.
 *
 * <example>
    :location.js
    // get the current geo location
    client.location().then(function(res) { ... });

    // set the current geo location
    client.location({latitude: 121.21, longitude: 11.56, altitude: 94.23})
 * </example>
 *
 * @param {Object} location  the new location
 * @returns {Object}         the current geo location
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/location
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var location = function location(l) {
    var data = {};

    if (typeof l === 'object' && l.latitude !== undefined && l.longitude !== undefined && l.altitude !== undefined) {
        data = l;
    }

    return this.requestHandler.create('/session/:sessionId/location', {
        location: data
    });
};

exports['default'] = location;
module.exports = exports['default'];
