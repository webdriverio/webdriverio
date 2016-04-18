/**
 *
 * Get the current geolocation.
 *
 * @returns {Object} the current geo location (`{latitude: number, longitude: number, altitude: number}`)
 * @uses protocol/location
 * @type mobile
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var getGeoLocation = function getGeoLocation() {
    return this.unify(this.location(), {
        extractValue: true
    });
};

exports["default"] = getGeoLocation;
module.exports = exports["default"];
