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

'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var logTypes = undefined;

function getLogTypes() {
    return logTypes ? _Promise.resolve(logTypes) : this.logTypes().then(function (types) {
        logTypes = types;
        return logTypes;
    });
}

var log = function log(type) {
    var _this = this;

    if (typeof type !== 'string' || type === '') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with log command');
    }

    return getLogTypes.call(this).then(function (types) {
        if (types.value.indexOf(type) === -1) {
            throw new _utilsErrorHandler.ProtocolError('this log type ("' + type + '") is not available for this browser/device');
        }

        return _this.requestHandler.create('/session/:sessionId/log', {
            type: type
        });
    });
};

exports['default'] = log;
module.exports = exports['default'];
