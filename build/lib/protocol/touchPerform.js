/**
 *
 * Performs a specific touch action. The action object need to contain the action
 * name (longPress, press, tap, wait, moveTo, release) and additional information
 * about either the element, x/y coordinates or touch counts.
 *
 * <example>
    :touchPerformPress.js
    browser.touchPerform({
        action: 'press',
        type: {
            x: 100,
            y: 250
        }
    });

    :touchPerformTap.js
    browser.touchPerform({
        action: 'tap',
        options: {
            el: '1', // json web element was queried before
            x: 10,   // x offset
            y: 20,   // y offset
            count: 1 // number of touches
        }
    });
 * </example>
 *
 * @param {Object} actions  touch action as object or object[] with attributes like touchCount, x, y, duration
 *
 * @see  https://github.com/appium/node-mobile-json-wire-protocol/blob/master/docs/protocol-methods.md#mobile-json-wire-protocol-endpoints
 * @type mobile
 * @for android, ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var touchPerform = function touchPerform(actions) {
    return this.requestHandler.create({
        path: '/session/:sessionId/touch/perform',
        method: 'POST'
    }, { actions: actions });
};

exports['default'] = touchPerform;
module.exports = exports['default'];
