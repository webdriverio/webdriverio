/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (in)visible. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is visible.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses util/waitUntil, property/isVisible
 * @type utility
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var waitForVisible = function waitForVisible(selector, ms, reverse) {
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
        return _this.isVisible(selector).then(function (isVisible) {
            if (!Array.isArray(isVisible)) {
                return isVisible !== reverse;
            }

            var result = reverse;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(isVisible), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
            var isReversed = reverse ? '' : 'not';
            throw new _utilsErrorHandler.CommandError('element (' + selector + ') still ' + isReversed + ' visible after ' + ms + 'ms');
        }
        throw e;
    });
};

exports['default'] = waitForVisible;
module.exports = exports['default'];
