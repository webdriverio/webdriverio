/**
 *
 * This wait command is your universal weapon if you want to wait on
 * something. It expects a condition and waits until that condition
 * is fulfilled with an truthy value. A condition can be either a promise
 * or a command that returns a promise.
 *
 * A common example is to wait until a certain element contains a certain
 * text.
 *
 * <example>
    :example.html
    <div id="someText">I am some text</div>
    <script>
      setTimeout(function() {
        $('#someText').html('I am now different');
      }, 1000);
    </script>

    :waitUntil.js
    client.waitUntil(function() {
      return this.getText('#someText').then(function(text) {
        return text === 'I am now different'
      });
    });
 * </example>
 *
 *
 * @param {Function|Promise} condition  condition to wait on
 * @param {Number=}          ms         timeout in ms (default: 500)
 * @param {Number=}          interval   interval between condition checks (default: 250)
 *
 * @uses utility/pause
 * @type utility
 *
 */

'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var _utilsTimer = require('../utils/Timer');

var _utilsTimer2 = _interopRequireDefault(_utilsTimer);

exports['default'] = function (condition, timeout, interval) {
    /*!
     * ensure that timeout and interval are set properly
     */
    if (typeof timeout !== 'number') {
        timeout = this.options.waitforTimeout;
    }

    if (typeof interval !== 'number') {
        interval = this.options.waitforInterval;
    }

    var fn = undefined;

    if (typeof condition === 'function') {
        fn = condition.bind(this);
    } else {
        fn = function () {
            return _Promise.resolve(condition);
        };
    }

    var timer = new _utilsTimer2['default'](interval, timeout, fn, true);

    return timer['catch'](function (e) {
        throw new _utilsErrorHandler.CommandError('Promise was rejected with the following reason: ' + e);
    });
};

module.exports = exports['default'];
