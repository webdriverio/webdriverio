/**
 *
 * Get informations about the current network connection (Data/WIFI/Airplane). The actual
 * server value will be a number (see `getNetworkConnection.js` example). However WebdriverIO
 * additional properties to the response object to allow easier assertions (see
 * `getNetworkConnectionEasier.js` example).
 *
 * <example>
    :getNetworkConnection.js
    client.getNetworkConnection().then(function(connection) {
        console.log(connection.value);
        // if 0: airplane mode off, wifi off, data off
        // if 1: airplane mode on, wifi off, data off
        // if 2: airplane mode off, wifi on, data off
        // if 4: airplane mode off, wifi off, data on
        // if 6: airplane mode off, wifi on, data on
    })

    :getNetworkConnectionEasier.js
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

import merge from 'deepmerge'

let getNetworkConnection = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/network_connection',
        method: 'GET'
    }).then((result) => {
        result = merge(result, {
            inAirplaneMode: result.value === 1,
            hasWifi: result.value === 2 || result.value === 6,
            hasData: result.value === 4 || result.value === 6
        })

        return result
    })
}

export default getNetworkConnection
