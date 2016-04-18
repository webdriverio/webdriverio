/**
 *
 * Search for multiple elements on the page, starting from the document root. The located
 * elements will be returned as a WebElement JSON objects. The table below lists the
 * locator strategies that each server should support. Elements should be returned in
 * the order located in the DOM.
 *
 * The array of elements can be retrieved  using the 'response.value' which is a
 * collection of element ID's and can be accessed in the subsequent commands
 * using the '.ELEMENT' method.
 *
 * @param {String} selector selector to query the elements
 * @returns {Object[]} A list of WebElement JSON objects for the located elements.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/elements
 * @type protocol
 *
 */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

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

var elements = function elements(_x) {
    var _this = this;

    var _again = true;

    _function: while (_again) {
        var selector = _x;
        _again = false;

        var requestPath = '/session/:sessionId/elements';
        var lastPromise = _this.lastResult ? (0, _q2['default'])(_this.lastResult).inspect() : _this.lastPromise.inspect();

        if (lastPromise.state === 'fulfilled' && (0, _helpersHasElementResultHelper2['default'])(lastPromise.value)) {
            if (!selector) {
                var newSelector = _Object$assign({}, lastPromise.value);
                /**
                 * if last result was an element result transform result into an array
                 */
                newSelector.value = Array.isArray(newSelector.value) ? newSelector.value : [newSelector.value];

                /**
                 * only return new selector if existing
                 * otherwise fetch again for selector
                 */
                if (newSelector.value.length === 0) {
                    _this.lastResult = null;
                    _x = newSelector.selector;
                    _again = true;
                    requestPath = lastPromise = newSelector = undefined;
                    continue _function;
                }

                return newSelector;
            }

            /**
             * format xpath selector (global -> relative)
             */
            if (selector.slice(0, 2) === '//') {
                selector = '.' + selector.slice(1);
            }

            var elem = lastPromise.value.value.ELEMENT;
            requestPath = '/session/:sessionId/element/' + elem + '/elements';
        }

        var found = (0, _helpersFindElementStrategy2['default'])(selector);
        return _this.requestHandler.create(requestPath, {
            using: found.using,
            value: found.value
        }).then(function (result) {
            result.selector = selector;
            return result;
        }, function (err) {
            if (err.message === 'no such element') {
                return [];
            }

            throw err;
        });
    }
};

exports['default'] = elements;
module.exports = exports['default'];
