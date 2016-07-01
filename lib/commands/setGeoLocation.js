/**
 *
 * Set the current geo location
 *
 * @alias browser.setGeoLocation
 * @param {Object} location the new location (`{latitude: number, longitude: number, altitude: number}`)
 * @uses protocol/location
 * @type mobile
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let setGeoLocation = function (location) {
    /*!
     * parameter check
     */
    if (typeof location !== 'object' ||
        location.latitude === undefined ||
        location.longitude === undefined ||
        location.altitude === undefined) {
        throw new CommandError('location object need to have a latitude, longitude and altitude attribute')
    }

    return this.location(location)
}

export default setGeoLocation
