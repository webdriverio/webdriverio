/**
 *
 * Returns a list of the currently active sessions. Each session will be returned
 * as a list of JSON objects with the following keys:
 *
 * | Key          | Type   | Description    |
 * |--------------|--------|----------------|
 * | id           | string | The session ID |
 * | capabilities | object | An object describing the [session capabilities](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Actual_Capabilities) |
 *
 * @returns {Object[]} a list of the currently active sessions
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/sessions
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var sessions = function sessions() {
    return this.requestHandler.create({
        path: '/sessions',
        method: 'GET',
        requiresSession: false
    });
};

exports['default'] = sessions;
module.exports = exports['default'];
