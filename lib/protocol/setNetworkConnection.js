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

import ProtocolError from '../utils/ErrorHandler'

let setNetworkConnection = function (type) {
    if (typeof type !== 'object') {
        throw new ProtocolError('number or type of arguments don\'t agree with setNetworkConnection protocol command')
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/network_connection',
        method: 'POST'
    }, {
        parameters: {
            type: type
        }
    })
}

export default setNetworkConnection
