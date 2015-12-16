/**
 *
 * Set network connection (Selendroid only).<br>
 * Types:<br>
 * 	- airplane mode: 1
 * 	-
 *
 *
 * <example>
    :setNetworkConnection.js
    client.setNetworkConnection({
        type: 1
    })
 * </example>
 *
 * @type mobile
 * @for selendroid
 * @see https://github.com/selendroid/selendroid/blob/c2ec0d49f18279e751ce0500f2454e7c494657f0/selendroid-client/src/main/java/io/selendroid/client/SelendroidDriver.java#L156-L159
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

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
