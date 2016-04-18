'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _tty = require('tty');

var _tty2 = _interopRequireDefault(_tty);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _supportsColor = require('supports-color');

var _supportsColor2 = _interopRequireDefault(_supportsColor);

var _helpersSanitize = require('../helpers/sanitize');

var _helpersSanitize2 = _interopRequireDefault(_helpersSanitize);

var _ReporterStats = require('./ReporterStats');

var ISATTY = _tty2['default'].isatty(1) && _tty2['default'].isatty(2);

var COLORS = {
    'pass': 90,
    'fail': 31,
    'bright pass': 92,
    'bright fail': 91,
    'bright yellow': 93,
    'pending': 36,
    'suite': 0,
    'error title': 0,
    'error message': 31,
    'error stack': 90,
    'checkmark': 32,
    'fast': 90,
    'medium': 33,
    'slow': 31,
    'green': 32,
    'light': 90,
    'diff gutter': 90,
    'diff added': 32,
    'diff removed': 31
};

var SYMBOLS_WIN = {
    ok: '√',
    err: '×',
    dot: '.',
    error: 'F'
};

var SYMBOLS = {
    ok: '✓',
    err: '✖',
    dot: '․',
    error: 'F'
};

var BaseReporter = (function (_events$EventEmitter) {
    _inherits(BaseReporter, _events$EventEmitter);

    function BaseReporter() {
        var _this = this;

        _classCallCheck(this, BaseReporter);

        _get(Object.getPrototypeOf(BaseReporter.prototype), 'constructor', this).call(this);

        this.reporters = [];
        this.printEpilogue = true;
        this.cursor = new Cursor();
        this.stats = new _ReporterStats.ReporterStats();

        this.on('start', function () {});

        this.on('runner:start', function (runner) {
            _this.stats.runnerStart(runner);
            _this.stats.specStart(runner);
        });

        this.on('runner:init', function (runner) {
            _this.stats.setSessionId(runner);
        });

        this.on('runner:beforecommand', function (command) {
            _this.stats.output('beforecommand', command);
        });

        this.on('runner:command', function (command) {
            _this.stats.output('command', command);
        });

        this.on('runner:aftercommand', function (command) {
            _this.stats.output('aftercommand', command);
        });

        this.on('runner:result', function (result) {
            _this.stats.output('result', result);
        });

        this.on('runner:screenshot', function (screenshot) {
            _this.stats.output('screenshot', screenshot);
        });

        this.on('runner:log', function (log) {
            _this.stats.output('log', log);
        });

        this.on('suite:start', function (suite) {
            _this.stats.suiteStart(suite);
        });

        this.on('hook:start', function (hook) {
            _this.stats.hookStart(hook);
        });

        this.on('hook:end', function (hook) {
            _this.stats.hookEnd(hook);
        });

        this.on('test:start', function (test) {
            _this.stats.testStart(test);
        });

        this.on('test:pass', function (test) {
            _this.stats.testPass(test);
        });

        this.on('test:fail', function (test) {
            _this.stats.testFail(test);
        });

        this.on('test:pending', function (test) {
            _this.stats.testPending(test);
        });

        this.on('test:end', function (test) {
            _this.stats.testEnd(test);
        });

        this.on('suite:end', function (runner) {
            _this.stats.suiteEnd(runner);
        });

        this.on('error', function (runner) {
            _this.printEpilogue = false;

            var fmt = _this.color('error message', 'ERROR: %s');
            console.log(fmt, runner.error.message);

            fmt = _this.color('bright yellow', _helpersSanitize2['default'].caps(runner.capabilities));
            console.log(fmt);

            if (runner.error.stack) {
                fmt = _this.color('error stack', runner.error.stack.replace('Error: ' + runner.error.message + '\n', ''));
            } else {
                fmt = _this.color('error stack', '    no stack available');
            }
            console.log(fmt);
        });

        this.on('runner:end', function (runner) {
            _this.stats.runnerEnd(runner);
        });

        this.on('end', function (args) {
            _this.stats.complete();
            _this.printEpilogue = _this.printEpilogue && !args.sigint;
        });
    }

    /**
     * Expose some basic cursor interactions
     * that are common among reporters.
     */

    /**
     * Color `str` with the given `type`,
     * allowing colors to be disabled,
     * as well as user-defined color
     * schemes.
     *
     * @param {String} type
     * @param {String} str
     * @return {String}
     * @api private
     */

    _createClass(BaseReporter, [{
        key: 'color',
        value: function color(type, str) {
            if (!_supportsColor2['default']) return String(str);
            return '\u001b[' + COLORS[type] + 'm' + str + '\u001b[0m';
        }
    }, {
        key: 'limit',
        value: function limit(val) {
            return _helpersSanitize2['default'].limit(val);
        }

        /**
         * Output common epilogue used by many of
         * the bundled reporters.
         *
         * @api public
         */
    }, {
        key: 'epilogue',
        value: function epilogue() {
            if (!this.printEpilogue) {
                return;
            }

            var counts = this.stats.getCounts();

            console.log('\n');

            // passes
            var fmt = this.color('green', '%d passing') + this.color('light', ' (%ss)');
            console.log(fmt, counts.passes || 0, (Math.round(this.stats.duration / 100) / 10).toFixed(2));

            // pending
            if (counts.pending) {
                fmt = this.color('pending', '%d pending');
                console.log(fmt, counts.pending);
            }

            // failures
            if (counts.failures) {
                fmt = this.color('fail', '%d failing');
                console.log(fmt, counts.failures);
                this.listFailures();
            }

            console.log();

            this.printEpilogue = false;
        }

        /**
         * Outut the given failures as a list
         */
    }, {
        key: 'listFailures',
        value: function listFailures() {
            var _this2 = this;

            console.log();
            this.stats.getFailures().forEach(function (test, i) {
                var fmt = _this2.color('error title', '%s) %s:\n') + _this2.color('error message', '%s') + _this2.color('bright yellow', '%s') + _this2.color('error stack', '\n%s\n');
                console.log(fmt, i + 1, test.title, test.err.message, test.runningBrowser, test.err.stack);
            });
        }
    }, {
        key: 'add',
        value: function add(reporter) {
            this.reporters.push(reporter);
        }

        // Although BaseReporter is an eventemitter, handleEvent() is called instead of emit()
        // so that every event can be propagated to attached reporters
    }, {
        key: 'handleEvent',
        value: function handleEvent() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            if (this.listeners(args[0]).length) {
                this.emit.apply(this, args);
            }

            if (this.reporters.length === 0) {
                return;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.reporters), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var reporter = _step.value;

                    /**
                     * skip reporter if
                     *  - he isn't an eventemitter
                     *  - event is not registered
                     */
                    if (typeof reporter.emit !== 'function' || !reporter.listeners(args[0]).length) {
                        continue;
                    }

                    reporter.emit.apply(reporter, args);
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
        }

        /**
         * Default color map.
         */
    }, {
        key: 'colors',
        get: function get() {
            return COLORS;
        }

        /**
         * Default symbol map.
         */
    }, {
        key: 'symbols',
        get: function get() {
            /**
             * With node.js on Windows: use symbols available in terminal default fonts
             */
            if (process.platform === 'win32') {
                return SYMBOLS_WIN;
            }

            return SYMBOLS;
        }
    }]);

    return BaseReporter;
})(_events2['default'].EventEmitter);

var Cursor = (function () {
    function Cursor() {
        _classCallCheck(this, Cursor);
    }

    _createClass(Cursor, [{
        key: 'hide',
        value: function hide() {
            ISATTY && process.stdout.write('\u001b[?25l');
        }
    }, {
        key: 'show',
        value: function show() {
            ISATTY && process.stdout.write('\u001b[?25h');
        }
    }, {
        key: 'deleteLine',
        value: function deleteLine() {
            ISATTY && process.stdout.write('\u001b[2K');
        }
    }, {
        key: 'beginningOfLine',
        value: function beginningOfLine() {
            ISATTY && process.stdout.write('\u001b[0G');
        }
    }, {
        key: 'CR',
        value: function CR() {
            if (ISATTY) {
                this.deleteLine();
                this.beginningOfLine();
            } else {
                process.stdout.write('\r');
            }
        }
    }, {
        key: 'isatty',
        get: function get() {
            return ISATTY;
        }
    }]);

    return Cursor;
})();

exports['default'] = BaseReporter;
exports.Cursor = Cursor;
