/**
 *
 * Get the log for a given log type. Log buffer is reset after each request
 *
 * @param {String} type  The [log type](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Log_Type). This must be provided.
 * @returns {Object[]} The list of [log entries](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Log_Entry_JSON_Object)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/log
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function log (type) {

    if(typeof type !== 'string' || type === '') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with log command'));
    }

    this.requestHandler.create(
        '/session/:sessionId/log',
        type,
        arguments[arguments.length - 1]
    );

};
