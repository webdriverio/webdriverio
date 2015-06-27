/**
 *
 * Protocol bindings for all geolocation operations.
 *
 * <example>
    :location.js
    // get the current geo location
    client.location(function(err,res) { ... });

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

module.exports = function location(l) {
    var data = {};

    if (typeof l === 'object' && l.latitude && l.longitude && l.altitude) {
        data = l;
    }

    return this.requestHandler.create(
        '/session/:sessionId/location',
        { location: data }
    );
};

