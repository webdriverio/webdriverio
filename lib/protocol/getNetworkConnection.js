/**
 *
 * get informations about the current network connection (Data/WIFI/Airplane)
 *
 * @callbackParameter error, response
 *
 * @type appium
 *
 */

module.exports = function getNetworkConnection() {

    var requestOptions = {
        path: '/session/:sessionId/network_connection',
        method: 'GET'
    };

    return this.requestHandler.create(requestOptions);

};