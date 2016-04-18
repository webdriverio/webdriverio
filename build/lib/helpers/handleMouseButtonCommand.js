'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

/**
 * call must be scoped to the webdriverio client
 */
var handleMouseButtonCommand = function handleMouseButtonCommand(selector, button) {
    var _this = this;

    /**
     * mobile only supports simple clicks
     */
    if (this.isMobile) {
        if (!selector) {
            throw new _utilsErrorHandler.ProtocolError('the leftClick/middleClick/rightClick command requires an element to click on');
        }

        return this.click(selector);
    }

    /**
     * just press button if no selector is given
     */
    if (!selector) {
        return this.buttonPress(button);
    }

    return this.element(selector).then(function (res) {
        return _this.moveTo(res.value.ELEMENT).buttonPress(button);
    });
};

exports['default'] = handleMouseButtonCommand;
module.exports = exports['default'];
