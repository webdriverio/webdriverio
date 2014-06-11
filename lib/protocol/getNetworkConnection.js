/**
 *
 * get app strings (Appium specific command)
 *
 * ### Usage:
 *
 *     client.getNetworkConnection()
 *
 */

module.exports = function getNetworkConnection() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/network_connection',
        method: 'GET'
    };

    this.requestHandler.create(requestOptions, callback);

};