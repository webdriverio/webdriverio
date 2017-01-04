/**
 *
 * Get the current geolocation.
 *
 * <example>
    :getGeoLocation.js
    it('should return my current location', function () {
        var location = browser.getGeoLocation()
        console.log(location)
        // outputs:
        // {
        //     latitude: 51.1045407,
        //     longitude: 13.2017384,
        //     altitude: 20.23345
        // }
    })
 * </example>
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
