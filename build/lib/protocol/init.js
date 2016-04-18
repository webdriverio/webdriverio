/**
 *
 * Create a new session. The server should attempt to create a session that most
 * closely matches the desired and required capabilities. Required capabilities
 * have higher priority than desired capabilities and must be set for the session
 * to be created.
 *
 * @param {Object} [capabilities] An object describing the session's [desired capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session
 * @type protocol
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var _packageJson = require('../../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var init = function init() {
    var desiredCapabilities = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    /**
     * make sure we don't run this command within wdio test run
     */
    if (this.options.isWDIO) {
        throw new _utilsErrorHandler.CommandError('Don\'t call the \'init\' command when using the wdio test runner. ' + 'Your session will get initialised and closed automatically.');
    }

    /*!
     * check if session was already established
     */
    if (this.requestHandler.sessionID) {
        throw new _utilsErrorHandler.ProtocolError('Cannot init a new session, please end your current session first');
    }

    this.desiredCapabilities = (0, _deepmerge2['default'])(this.desiredCapabilities, desiredCapabilities);
    if (desiredCapabilities.sessionId) {
        this.sessionId = desiredCapabilities.sessionId;
    }

    /**
     * report library identity to server
     * @see https://groups.google.com/forum/#!topic/selenium-developers/Zj1ikTz632o
     */
    this.desiredCapabilities = (0, _deepmerge2['default'])(this.desiredCapabilities, {
        requestOrigins: {
            url: _packageJson2['default'].homepage,
            version: _packageJson2['default'].version,
            name: _packageJson2['default'].name
        }
    });

    return this.requestHandler.create({
        path: '/session',
        method: 'POST'
    }, {
        desiredCapabilities: this.desiredCapabilities
    });
};

exports['default'] = init;
module.exports = exports['default'];
