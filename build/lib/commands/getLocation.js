/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    client
        .url('http://github.com')
        .getLocation('.header-logo-wordmark').then(function (location) {
            console.log(location); // outputs: { x: 100, y: 200 }
        })
        .getLocation('.header-logo-wordmark', 'x').then(function (location) {
            console.log(location); // outputs: 100
        })
        .getLocation('.header-logo-wordmark', 'y').then(function (location) {
            console.log(location); // outputs: 200
        });
 * </example>
 *
 * @param {String} selector    element with requested position offset
 * @returns {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 *
 * @uses protocol/elements, protocol/elementIdLocation
 * @type property
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var getLocation = function getLocation(selector, prop) {
    var _this = this;

    return this.elements(selector).then(function (res) {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new _utilsErrorHandler.CommandError(7);
        }

        var elementIdLocationCommands = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var elem = _step.value;

                elementIdLocationCommands.push(_this.elementIdLocation(elem.ELEMENT));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return _Promise.all(elementIdLocationCommands);
    }).then(function (locations) {
        locations = locations.map(function (location) {
            if (typeof prop === 'string' && prop.match(/(x|y)/)) {
                return location.value[prop];
            }

            return {
                x: location.value.x,
                y: location.value.y
            };
        });

        return locations.length === 1 ? locations[0] : locations;
    });
};

exports['default'] = getLocation;
module.exports = exports['default'];
