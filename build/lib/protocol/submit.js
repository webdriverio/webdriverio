/**
 *
 * Submit a FORM element. The submit command may also be applied to any element
 * that is a descendant of a FORM element.
 *
 * @param {String} ID ID of a `<form />` WebElement JSON object to route the command to
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/submit
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var submit = function submit(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with submit protocol command');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/element/' + id + '/submit',
        method: 'POST'
    });
};

exports['default'] = submit;
module.exports = exports['default'];
