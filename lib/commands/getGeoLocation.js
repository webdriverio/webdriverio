/**
 *
 * Get the current geolocation.
 *
 * @alias browser.getGeoLocation
 * @returns {Object} the current geo location (`{latitude: number, longitude: number, altitude: number}`)
 * @uses protocol/location
 * @type mobile
 *
 */

let getGeoLocation = function () {
    return this.unify(this.location(), {
        extractValue: true
    })
}

export default getGeoLocation
