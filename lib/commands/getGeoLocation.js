/**
 *
 * Get the current geolocation.
 *
 * @returns {Object} the current geo location (`{latitude: number, longitude: number, altitude: number}`)
 * @uses protocol/location
 * @type mobile
 *
 */

module.exports = function getGeoLocation () {
    return this.unify(this.location(), {
        extractValue: true
    });
};