/**
 *
 * Perform touch action
 *
 * @param {Object} touchAttr contains attributes of touch gesture (e.g. `element`, `x` and `y`)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#touchaction--multitouchaction
 * @type mobile
 * @for android, ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var performTouchAction = function performTouchAction(action) {
    if (typeof action !== 'object') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with performTouchAction protocol command');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/touch/perform',
        method: 'POST'
    }, action);
};

exports['default'] = performTouchAction;
module.exports = exports['default'];
