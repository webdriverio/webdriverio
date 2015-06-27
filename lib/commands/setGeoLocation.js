/**
 *
 * set the current geo location
 *
 * @param {Object} location the new location (`{latitude: number, longitude: number, altitude: number}`)
 *
 * @uses protocol/location
 * @type mobile
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setGeoLocation (location) {

    /*!
     * parameter check
     */
    if(typeof location !== 'object' || !location.latitude || !location.longitude || !location.altitude) {
        throw new ErrorHandler.CommandError('location object need to have a latitude, longitude and altitude attribute');
    }

    return this.location(location);

};