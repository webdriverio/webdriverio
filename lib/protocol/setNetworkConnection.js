/**
 *
 * Set network connection.
 *
 * <example>
    :setNetworkConnection.js
    client.setNetworkConnection(type)
 * </example>
 *
 * @type appium
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setNetworkConnection(type) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof type !== 'object') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with setNetworkConnection protocol command'));
    }

    var requestOptions = {
        path: '/session/:sessionId/network_connection',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, {parameters: {type: type}}, callback);

};