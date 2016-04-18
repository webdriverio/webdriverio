/**
 *
 * Get informations about the current network connection (Data/WIFI/Airplane). The actual
 * server value will be a number (see `getNetworkConnection.js` example). However WebdriverIO
 * additional properties to the response object to allow easier assertions (see
 * `getNetworkConnectionEasier.js` example).
 *
 * <example>
    :getNetworkConnectionAsync.js
    client.getNetworkConnection().then(function(connection) {
        console.log(connection.value); // returns 6
        console.log(connection.inAirplaneMode); // returns false
        console.log(connection.hasWifi); // returns true
        console.log(connection.hasData); // returns true
    })
 * </example>
 *
 * @type mobile
 * @see https://github.com/appium/appium-android-driver/blob/master/lib/commands/network.js#L8-L22
 * @for android
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var getNetworkConnection = function getNetworkConnection() {
    return this.requestHandler.create({
        path: '/session/:sessionId/network_connection',
        method: 'GET'
    }).then(function (result) {
        result = (0, _deepmerge2['default'])(result, {
            value: result.value,
            inAirplaneMode: result.value === 1,
            hasWifi: result.value === 2 || result.value === 6,
            hasData: result.value === 4 || result.value === 6
        });

        return result;
    });
};

exports['default'] = getNetworkConnection;
module.exports = exports['default'];
