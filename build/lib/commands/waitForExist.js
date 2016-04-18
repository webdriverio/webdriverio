/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be present within the DOM. Returns true if the selector
 * matches at least one element that exists in the DOM. If the reverse flag
 * is true, the command will instead return true if the selector does not
 * match any elements.
 *
 * @param {String}   selector CSS selector to query
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it instead waits for the selector to not match any elements (default: false)
 *
 * @uses util/waitUntil, property/isExisting
 * @type utility
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var waitForExist = function waitForExist(selector, ms, reverse) {
    var _this = this;

    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if reverse is used, like
     *
     * ```js
     * var elem = browser.element('#elem');
     * elem.waitForXXX(10000, true);
     * ```
     */
    reverse = typeof reverse === 'boolean' ? reverse : false;

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    return this.waitUntil(function () {
        return _this.isExisting(selector).then(function (isExisting) {
            if (!Array.isArray(isExisting)) {
                return isExisting !== reverse;
            }

            var result = reverse;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(isExisting), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var val = _step.value;

                    if (!reverse) {
                        result = result || val;
                    } else {
                        result = result && val;
                    }
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

            return result !== reverse;
        });
    }, ms)['catch'](function (e) {
        if ((0, _utilsErrorHandler.isTimeoutError)(e)) {
            var isReversed = reverse ? '' : 'not ';
            throw new _utilsErrorHandler.CommandError('element (' + selector + ') still ' + isReversed + 'existing after ' + ms + 'ms');
        }
        throw e;
    });
};

exports['default'] = waitForExist;
module.exports = exports['default'];
