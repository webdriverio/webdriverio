/**
 *
 * Protocol bindings for all geolocation operations. (Not part of the official Webdriver specification).
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
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidlocation
 * @type protocol
 *
 */

let location = function (l) {
    let data = {}

    if (typeof l === 'object' &&
        l.latitude !== undefined &&
        l.longitude !== undefined &&
        l.altitude !== undefined) {
        data = l
    }

    return this.requestHandler.create('/session/:sessionId/location', {
        location: data
    })
}

export default location
