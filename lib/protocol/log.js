/**
 *
 * Get the log for a given log type. Log buffer is reset after each request
 *
 * @param {String} type  The [log type](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Log_Type). This must be provided.
 * @returns {Object[]} The list of [log entries](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Log_Entry_JSON_Object)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/log
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let logTypes

function getLogTypes () {
    return logTypes ? Promise.resolve(logTypes) : this.logTypes()
    .then((types) => {
        logTypes = types
        return logTypes
    })
}

let log = function (type) {
    if (typeof type !== 'string' || type === '') {
        throw new ProtocolError('number or type of arguments don\'t agree with log command')
    }

    return getLogTypes.call(this).then((types) => {
        if (types.value.indexOf(type) === -1) {
            throw new ProtocolError(`this log type ("${type}") is not available for this browser/device`)
        }

        return this.requestHandler.create('/session/:sessionId/log', {
            type: type
        })
    })
}

export default log
