'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var BUTTON_ENUM = {
    left: 0,
    middle: 1,
    right: 2
};

/**
 * call must be scoped to the webdriverio client
 */
var handleMouseButtonProtocol = function handleMouseButtonProtocol(requestPath, button) {
    if (typeof button !== 'number') {
        button = BUTTON_ENUM[button || 'left'];
    }

    return this.requestHandler.create(requestPath, { button: button });
};

exports['default'] = handleMouseButtonProtocol;
module.exports = exports['default'];
