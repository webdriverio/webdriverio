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

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var setGeoLocation = function setGeoLocation(location) {
  /*!
   * parameter check
   */
  if (typeof location !== 'object' || location.latitude === undefined || location.longitude === undefined || location.altitude === undefined) {
    throw new _utilsErrorHandler.CommandError('location object need to have a latitude, longitude and altitude attribute');
  }

  return this.location(location);
};

exports['default'] = setGeoLocation;
module.exports = exports['default'];
