'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _helpersSanitize = require('../helpers/sanitize');

var _helpersSanitize2 = _interopRequireDefault(_helpersSanitize);

var RunnableStats = (function () {
    function RunnableStats(type) {
        _classCallCheck(this, RunnableStats);

        this.type = type;
        this.start = new Date();
        this._duration = 0;
    }

    _createClass(RunnableStats, [{
        key: 'complete',
        value: function complete() {
            this.end = new Date();
            this._duration = this.end - this.start;
        }
    }, {
        key: 'duration',
        get: function get() {
            if (this.end) {
                return this._duration;
            }
            return new Date() - this.start;
        }
    }]);

    return RunnableStats;
})();

var RunnerStats = (function (_RunnableStats) {
    _inherits(RunnerStats, _RunnableStats);

    function RunnerStats(runner) {
        _classCallCheck(this, RunnerStats);

        _get(Object.getPrototypeOf(RunnerStats.prototype), 'constructor', this).call(this, 'runner');
        this.cid = runner.cid;
        this.capabilities = runner.capabilities;
        this.sanitizedCapabilities = runner.capabilities && _helpersSanitize2['default'].caps(runner.capabilities);
        this.config = runner.config;
        this.specs = {};
    }

    return RunnerStats;
})(RunnableStats);

var SpecStats = (function (_RunnableStats2) {
    _inherits(SpecStats, _RunnableStats2);

    function SpecStats(runner) {
        _classCallCheck(this, SpecStats);

        _get(Object.getPrototypeOf(SpecStats.prototype), 'constructor', this).call(this, 'spec');
        this.files = runner.specs;
        this.specHash = runner.specHash;
        this.suites = {};
        this.output = [];
    }

    return SpecStats;
})(RunnableStats);

var SuiteStats = (function (_RunnableStats3) {
    _inherits(SuiteStats, _RunnableStats3);

    function SuiteStats(runner) {
        _classCallCheck(this, SuiteStats);

        _get(Object.getPrototypeOf(SuiteStats.prototype), 'constructor', this).call(this, 'suite');
        this.title = runner.title;
        this.tests = {};
    }

    return SuiteStats;
})(RunnableStats);

var TestStats = (function (_RunnableStats4) {
    _inherits(TestStats, _RunnableStats4);

    function TestStats(runner) {
        _classCallCheck(this, TestStats);

        _get(Object.getPrototypeOf(TestStats.prototype), 'constructor', this).call(this, 'test');
        this.title = runner.title;
        this.state = '';
        this.screenshots = [];
        this.output = [];
    }

    return TestStats;
})(RunnableStats);

var ReporterStats = (function (_RunnableStats5) {
    _inherits(ReporterStats, _RunnableStats5);

    function ReporterStats() {
        _classCallCheck(this, ReporterStats);

        _get(Object.getPrototypeOf(ReporterStats.prototype), 'constructor', this).call(this, 'base');

        this.counts = {
            suites: 0,
            tests: 0,
            passes: 0,
            pending: 0,
            failures: 0
        };
        this.runners = {};
        this.failures = [];
    }

    _createClass(ReporterStats, [{
        key: 'getCounts',
        value: function getCounts() {
            return this.counts;
        }
    }, {
        key: 'getFailures',
        value: function getFailures() {
            var _this = this;

            return this.failures.map(function (test) {
                test.runningBrowser = '';
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(_Object$keys(test.runner)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var pid = _step.value;

                        var caps = test.runner[pid];
                        test.runningBrowser += '\nrunning';

                        if (caps.browserName) {
                            test.runningBrowser += ' ' + caps.browserName;
                        }
                        if (caps.version) {
                            test.runningBrowser += ' (v' + caps.version + ')';
                        }
                        if (caps.platform) {
                            test.runningBrowser += ' on ' + caps.platform;
                        }

                        var host = _this.runners[pid].config.host;
                        if (host && host.indexOf('saucelabs') > -1) {
                            test.runningBrowser += '\nCheck out job at https://saucelabs.com/tests/' + _this.runners[pid].sessionID;
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

                return test;
            });
        }
    }, {
        key: 'runnerStart',
        value: function runnerStart(runner) {
            if (!this.runners[runner.cid]) {
                this.runners[runner.cid] = new RunnerStats(runner);
            }
        }
    }, {
        key: 'getRunnerStats',
        value: function getRunnerStats(runner) {
            if (!this.runners[runner.cid]) throw Error('Unrecognised runner [' + runner.cid + ']');
            return this.runners[runner.cid];
        }
    }, {
        key: 'getSpecHash',
        value: function getSpecHash(runner) {
            if (!runner.specHash) {
                if (!runner.specs) throw Error('Cannot generate spec hash for runner with no \'specs\' key');
                runner.specHash = _crypto2['default'].createHash('md5').update(runner.specs.join('')).digest('hex');
            }
            return runner.specHash;
        }
    }, {
        key: 'specStart',
        value: function specStart(runner) {
            var specHash = this.getSpecHash(runner);
            this.getRunnerStats(runner).specs[specHash] = new SpecStats(runner);
        }
    }, {
        key: 'getSpecStats',
        value: function getSpecStats(runner) {
            var runnerStats = this.getRunnerStats(runner);
            var specHash = this.getSpecHash(runner);
            if (!runnerStats.specs[specHash]) throw Error('Unrecognised spec [' + specHash + '] for runner [' + runner.cid + ']');
            return runnerStats.specs[specHash];
        }
    }, {
        key: 'setSessionId',
        value: function setSessionId(runner) {
            this.getRunnerStats(runner).sessionID = runner.sessionID;
        }
    }, {
        key: 'suiteStart',
        value: function suiteStart(runner) {
            this.getSpecStats(runner).suites[runner.title] = new SuiteStats(runner);
            this.counts.suites++;
        }
    }, {
        key: 'getSuiteStats',
        value: function getSuiteStats(runner, suiteTitle) {
            var specStats = this.getSpecStats(runner);
            return specStats.suites[suiteTitle];
        }
    }, {
        key: 'hookStart',
        value: function hookStart(runner) {
            var suiteStat = this.getSuiteStats(runner, runner.parent);

            if (!suiteStat) {
                return;
            }

            suiteStat.tests[runner.title] = new TestStats(runner);
        }
    }, {
        key: 'hookEnd',
        value: function hookEnd(runner) {
            var testStats = this.getTestStats(runner);

            if (!testStats) {
                return;
            }

            testStats.complete();
            this.counts.tests++;
        }
    }, {
        key: 'testStart',
        value: function testStart(runner) {
            this.getSuiteStats(runner, runner.parent).tests[runner.title] = new TestStats(runner);
        }
    }, {
        key: 'getTestStats',
        value: function getTestStats(runner) {
            var suiteStats = this.getSuiteStats(runner, runner.parent);

            if (!suiteStats) {
                return;
            }

            // Errors encountered inside hooks (e.g. beforeEach) can be identified by looking
            // at the currentTest param (currently only applicable to the Mocha adapter).
            var title = runner.currentTest || runner.title;
            if (!suiteStats.tests[title]) {
                title = runner.title;
            }

            if (!suiteStats.tests[title]) throw Error('Unrecognised test [' + title + '] for suite [' + runner.parent + ']');
            return suiteStats.tests[title];
        }
    }, {
        key: 'output',
        value: function output(type, runner) {
            runner.time = new Date();
            if (runner.title && runner.parent) {
                this.getTestStats(runner).output.push({
                    type: type,
                    payload: runner
                });
            } else {
                // Log commands, results and screenshots executed outside of a test
                this.getSpecStats(runner).output.push({
                    type: type,
                    payload: runner
                });
            }
        }
    }, {
        key: 'testPass',
        value: function testPass(runner) {
            this.getTestStats(runner).state = 'pass';
            this.counts.passes++;
        }
    }, {
        key: 'testPending',
        value: function testPending(runner) {
            // Pending tests don't actually start, so won't yet be registered
            this.testStart(runner);
            this.testEnd(runner);
            this.getTestStats(runner).state = 'pending';
            this.counts.pending++;
        }
    }, {
        key: 'testFail',
        value: function testFail(runner) {
            var testStats = undefined;
            try {
                testStats = this.getTestStats(runner);
            } catch (e) {
                // If a test fails during the before() or beforeEach() hook, it will not yet
                // have been 'started', so start now
                this.testStart(runner);
                testStats = this.getTestStats(runner);
            }

            testStats.state = 'fail';
            testStats.error = runner.err;
            this.counts.failures++;

            /**
             * check if error also happened in other runners
             */
            var duplicateError = false;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.failures), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var failure = _step2.value;

                    if (runner.err.message !== failure.err.message || failure.title !== runner.title) {
                        continue;
                    }
                    duplicateError = true;
                    failure.runner[runner.cid] = runner.runner[runner.cid];
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            if (!duplicateError) {
                this.failures.push(runner);
            }
        }
    }, {
        key: 'testEnd',
        value: function testEnd(runner) {
            this.getTestStats(runner).complete();
            this.counts.tests++;
        }
    }, {
        key: 'suiteEnd',
        value: function suiteEnd(runner) {
            this.getSuiteStats(runner, runner.title).complete();
        }
    }, {
        key: 'runnerEnd',
        value: function runnerEnd(runner) {
            this.getSpecStats(runner).complete();
        }
    }]);

    return ReporterStats;
})(RunnableStats);

exports.RunnableStats = RunnableStats;
exports.RunnerStats = RunnerStats;
exports.SpecStats = SpecStats;
exports.SuiteStats = SuiteStats;
exports.TestStats = TestStats;
exports.ReporterStats = ReporterStats;
