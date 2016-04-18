/**
 *
 * Move the mouse by an offset of the specificed element. If no element is specified,
 * the move is relative to the current mouse cursor. If an element is provided but
 * no offset, the mouse will be moved to the center of the element. If the element
 * is not visible, it will be scrolled into view.
 *
 * @param {String} element  Opaque ID assigned to the element to move to, as described in the WebElement JSON Object. If not specified or is null, the offset is relative to current position of the mouse.
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/moveto
 * @type protocol
 *
 */

'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var moveTo = function moveTo(element, xoffset, yoffset) {
    var data = {};

    if (typeof element === 'string') {
        data.element = element;
    }

    if (typeof xoffset === 'number') {
        data.xoffset = xoffset;
    }

    if (typeof yoffset === 'number') {
        data.yoffset = yoffset;
    }

    /**
     * if no attribute is set, throw error
     */
    if (_Object$keys(data).length === 0) {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with moveTo command');
    }

    return this.requestHandler.create('/session/:sessionId/moveto', data);
};

exports['default'] = moveTo;
module.exports = exports['default'];
