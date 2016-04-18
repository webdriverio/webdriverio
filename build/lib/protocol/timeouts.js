/**
 * Configure the amount of time that a particular type of operation can execute
 * for before they are aborted and a |Timeout| error is returned to the client.
 *
 * @param {String} type The type of operation to set the timeout for. Valid values are:<br>- **script** for script timeouts<br>- **implicit** for modifying the implicit wait timeout<br>- **page load** for setting a page load timeout.
 * @param {Number} ms   The amount of time, in milliseconds, that time-limited commands are permitted to run.
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/timeouts
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var timeouts = function timeouts(type, ms) {
    /*!
     * parameter check
     */
    if (typeof type !== 'string' || typeof ms !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with timeouts protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/timeouts', {
        type: type,
        ms: ms
    });
};

exports['default'] = timeouts;
module.exports = exports['default'];
