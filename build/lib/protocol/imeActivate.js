/**
 *
 * Make an engines that is available (appears on the list returned by getAvailableEngines) active.
 * After this call, the engine will be added to the list of engines loaded in the IME daemon and the
 * input sent using sendKeys will be converted by the active engine. Note that this is a
 * platform-independent method of activating IME (the platform-specific way being using keyboard shortcuts
 *
 * @param {String} engine   Name of the engine to activate.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/ime/activate
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var imeActivate = function imeActivate(engine) {
    if (typeof engine !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with imeActivate protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/ime/activate', {
        engine: engine
    });
};

exports['default'] = imeActivate;
module.exports = exports['default'];
