/**
 *
 * set the current geo location
 *
 * @param {Object} location the new location (`{latitude: number, longitude: number, altitude: number}`)
 * @uses protocol/location
 * @type mobile
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setGeoLocation (location) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof location !== 'object' || !location.latitude || !location.longitude || !location.altitude) {
        return callback(new ErrorHandler.CommandError('location object need to have a latitude, longitude and altitude attribute'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.location(location, cb);
        },
        function(res, cb) {
            response.location = res;
            cb();
        }
    ], function(err) {

        callback(err,null,response);

    });

};