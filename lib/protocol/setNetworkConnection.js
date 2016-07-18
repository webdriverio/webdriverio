/**
 *
 * Set network connection.<br>
 * Types:<br>
 * 	- airplane mode
 * 	- wifi on
 * 	- data on
 *
 * These properties behave like a bitmask so if you set the network connection to 0
 * everything will get turned off. However if you for example set the network connection
 * to 4 it will disable the airplane mode and turn off the wifi so that only data will
 * be enabled. WebdriverIO provides a simplified interface to set these values without
 * calculating bitmasks.
 *
 * Note: if you have airplane mode enabled you can't have wifi or data be enabled too
 * (for obvious reasons)
 *
 * <example>
    :setNetworkConnectionSync.js
    client.setNetworkConnection(0) // airplane mode off, wifi off, data off
    client.setNetworkConnection(1) // airplane mode on, wifi off, data off
    client.setNetworkConnection(2) // airplane mode off, wifi on, data off
    client.setNetworkConnection(4) // airplane mode off, wifi off, data on
    client.setNetworkConnection(6) // airplane mode off, wifi on, data on
 * </example>
 *
 * @type mobile
 * @for selendroid
 * @see https://github.com/appium/appium-android-driver/blob/master/lib/commands/network.js#L24-L46
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let setNetworkConnection = function (type) {
    if (typeof type !== 'number') {
        throw new ProtocolError('Number or type of arguments don\'t agree with setNetworkConnection protocol command.')
    } else if (type > 6 || type < 0) {
        throw new ProtocolError('Invalid value for network connection.')
    } else if (type === 3 || type === 5) {
        throw new ProtocolError('You can\'t have wifi or data enabled while in airplane mode.')
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
