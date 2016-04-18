/**
 * Search for an element on the page, starting from the document root.
 * The located element will be returned as a WebElement JSON object.
 * The table below lists the locator strategies that each server should support.
 * Each locator must return the first matching element located in the DOM.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element
 *
 * @param {String} selector selector to query the element
 * @returns {String} A WebElement JSON object for the located element.
 *
 * @type protocol
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpersFindElementStrategy = require('../helpers/findElementStrategy');

var _helpersFindElementStrategy2 = _interopRequireDefault(_helpersFindElementStrategy);

var _helpersHasElementResultHelper = require('../helpers/hasElementResultHelper');

var _helpersHasElementResultHelper2 = _interopRequireDefault(_helpersHasElementResultHelper);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var element = function element(selector) {
    var requestPath = '/session/:sessionId/element';
    var lastPromise = this.lastResult ? (0, _q2['default'])(this.lastResult).inspect() : this.lastPromise.inspect();

    if (lastPromise.state === 'fulfilled' && (0, _helpersHasElementResultHelper2['default'])(lastPromise.value) === 1) {
        if (!selector) {
            return lastPromise.value;
        }

        /**
         * format xpath selector (global -> relative)
         */
        if (selector.slice(0, 2) === '//') {
            selector = '.' + selector.slice(1);
        }

        var elem = lastPromise.value.value.ELEMENT;
        requestPath = '/session/:sessionId/element/' + elem + '/element';
    }

    var found = (0, _helpersFindElementStrategy2['default'])(selector);
    return this.requestHandler.create(requestPath, { using: found.using, value: found.value }).then(function (result) {
        result.selector = selector;
        return result;
    });
};

exports['default'] = element;
module.exports = exports['default'];
