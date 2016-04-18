
/**
 * Promise-based Timer. Execute fn every tick.
 * When fn is resolved — timer will stop
 * @param {Number} delay - delay between ticks
 * @param {Number} timeout - after that time timer will stop
 * @param {Function} fn - function that returns promise. will execute every tick
 * @param {Boolean} leading - should be function invoked on start
 * @returns {promise}
 */
'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var Timer = (function () {
    function Timer(delay, timeout, fn, leading) {
        var _this = this;

        _classCallCheck(this, Timer);

        this._delay = delay;
        this._timeout = timeout;
        this._fn = fn;
        this._leading = leading;

        this.start();

        return new _Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
        });
    }

    _createClass(Timer, [{
        key: 'start',
        value: function start() {
            var _this2 = this;

            this._start = Date.now();
            this._ticks = 0;
            if (this._leading) {
                this.tick();
            } else {
                this._timeoutId = setTimeout(this.tick.bind(this), this._delay);
            }

            this._mainTimeoutId = setTimeout(function () {
                _this2._reject('timeout');
                _this2.stop();
            }, this._timeout);
        }
    }, {
        key: 'stop',
        value: function stop() {
            if (this._timeoutId) {
                clearTimeout(this._timeoutId);
            }
            this._timeoutId = null;
        }
    }, {
        key: 'stopMain',
        value: function stopMain() {
            clearTimeout(this._mainTimeoutId);
        }
    }, {
        key: 'tick',
        value: function tick() {
            var _this3 = this;

            this._fn().then(function (res) {
                // resolve timer only on truthy values
                if (res) {
                    _this3._resolve(res);
                    _this3.stop();
                    _this3.stopMain();
                    return;
                }

                // autocorrect timer
                var diff = Date.now() - _this3._start - _this3._ticks++ * _this3._delay;
                var delay = Math.max(0, _this3._delay - diff);

                // clear old timeoutID
                _this3.stop();

                // check if we have time to one more tick
                if (_this3.hasTime(delay)) {
                    _this3._timeoutId = setTimeout(_this3.tick.bind(_this3), delay);
                } else {
                    _this3.stopMain();
                    _this3._reject('timeout');
                }
            })['catch'](function (err) {
                _this3.stop();
                _this3.stopMain();
                _this3._reject(err);
            });
        }
    }, {
        key: 'hasTime',
        value: function hasTime(delay) {
            return Date.now() - this._start + delay <= this._timeout;
        }
    }]);

    return Timer;
})();

exports['default'] = Timer;
module.exports = exports['default'];
