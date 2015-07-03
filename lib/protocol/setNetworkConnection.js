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

    if(typeof type !== 'object') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with setNetworkConnection protocol command');
    }

    var requestOptions = {
        path: '/session/:sessionId/network_connection',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, {parameters: {type: type}});

};