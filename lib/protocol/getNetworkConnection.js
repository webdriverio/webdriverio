/**
 *
 * get informations about the current network connection (Data/WIFI/Airplane)
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