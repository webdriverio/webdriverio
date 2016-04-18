'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _utilsConfigParser = require('./utils/ConfigParser');

var _utilsConfigParser2 = _interopRequireDefault(_utilsConfigParser);

var _utilsBaseReporter = require('./utils/BaseReporter');

var _utilsBaseReporter2 = _interopRequireDefault(_utilsBaseReporter);

var Launcher = (function () {
    function Launcher(configFile, argv) {
        _classCallCheck(this, Launcher);

        this.configParser = new _utilsConfigParser2['default']();
        this.configParser.addConfigFile(configFile);
        this.configParser.merge(argv);

        this.reporters = this.initReporters();

        this.argv = argv;
        this.configFile = configFile;

        this.exitCode = 0;
        this.hasTriggeredExitRoutine = false;
        this.hasStartedAnyProcess = false;
        this.processes = [];
        this.schedule = [];
    }

    /**
     * check if multiremote or wdio test
     */

    _createClass(Launcher, [{
        key: 'isMultiremote',
        value: function isMultiremote() {
            var caps = this.configParser.getCapabilities();
            return !Array.isArray(caps);
        }

        /**
         * initialise reporters
         */
    }, {
        key: 'initReporters',
        value: function initReporters() {
            var reporter = new _utilsBaseReporter2['default']();
            var config = this.configParser.getConfig();

            /**
             * if no reporter is set or config property is in a wrong format
             * just use the dot reporter
             */
            if (!config.reporters || !Array.isArray(config.reporters) || !config.reporters.length) {
                config.reporters = ['dot'];
            }

            var reporters = {};

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(config.reporters), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var reporterName = _step.value;

                    var Reporter = undefined;
                    if (typeof reporterName === 'function') {
                        Reporter = reporterName;
                        if (!Reporter.reporterName) {
                            throw new Error('Custom reporters must export a unique \'reporterName\' property');
                        }
                        reporters[Reporter.reporterName] = Reporter;
                    } else if (typeof reporterName === 'string') {
                        try {
                            Reporter = require('wdio-' + reporterName + '-reporter');
                        } catch (e) {
                            throw new Error('reporter "wdio-' + reporterName + '-reporter" is not installed. Error: ' + e.stack);
                        }
                        reporters[reporterName] = Reporter;
                    }
                    if (!Reporter) {
                        throw new Error('config.reporters must be an array of strings or functions, but got \'' + typeof reporterName + '\': ' + reporterName);
                    }
                }

                /**
                 * if no reporter options are set or property is in a wrong format default to
                 * empty object
                 */
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

            if (!config.reporterOptions || typeof config.reporterOptions !== 'object') {
                config.reporterOptions = {};
            }

            for (var reporterName in reporters) {
                var Reporter = reporters[reporterName];
                var reporterOptions = {};
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _getIterator(_Object$keys(config.reporterOptions)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var option = _step2.value;

                        if (option === reporterName && typeof config.reporterOptions[reporterName] === 'object') {
                            // Copy over options specifically for this reporter type
                            reporterOptions = _Object$assign(reporterOptions, config.reporterOptions[reporterName]);
                        } else if (reporters[option]) {
                            // Don't copy options for other reporters
                            continue;
                        } else {
                            // Copy over generic options
                            reporterOptions[option] = config.reporterOptions[option];
                        }
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

                reporter.add(new Reporter(reporter, config, reporterOptions));
            }

            return reporter;
        }

        /**
         * run sequence
         * @return  {Promise} that only gets resolves with either an exitCode or an error
         */
    }, {
        key: 'run',
        value: function run() {
            var config, caps, launcher, _exitCode, cid, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, capabilities, exitCode;

            return _regeneratorRuntime.async(function run$(context$2$0) {
                var _this = this;

                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        config = this.configParser.getConfig();
                        caps = this.configParser.getCapabilities();
                        launcher = this.getLauncher(config);

                        this.reporters.handleEvent('start');

                        /**
                         * run onPrepare hook
                         */
                        context$2$0.next = 6;
                        return _regeneratorRuntime.awrap(config.onPrepare(config, caps));

                    case 6:
                        context$2$0.next = 8;
                        return _regeneratorRuntime.awrap(this.runServiceHook(launcher, 'onPrepare', config, caps));

                    case 8:
                        if (!this.isMultiremote()) {
                            context$2$0.next = 13;
                            break;
                        }

                        context$2$0.next = 11;
                        return _regeneratorRuntime.awrap(new _Promise(function (resolve) {
                            _this.resolve = resolve;
                            _this.startInstance(_this.configParser.getSpecs(), caps, 0);
                        }));

                    case 11:
                        _exitCode = context$2$0.sent;
                        return context$2$0.abrupt('return', _exitCode);

                    case 13:
                        cid = 0;
                        _iteratorNormalCompletion3 = true;
                        _didIteratorError3 = false;
                        _iteratorError3 = undefined;
                        context$2$0.prev = 17;

                        for (_iterator3 = _getIterator(caps); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            capabilities = _step3.value;

                            this.schedule.push({
                                cid: cid++,
                                caps: capabilities,
                                specs: this.configParser.getSpecs(capabilities.specs, capabilities.exclude),
                                availableInstances: capabilities.maxInstances || config.maxInstancesPerCapability,
                                runningInstances: 0
                            });
                        }

                        /**
                         * catches ctrl+c event
                         */
                        context$2$0.next = 25;
                        break;

                    case 21:
                        context$2$0.prev = 21;
                        context$2$0.t0 = context$2$0['catch'](17);
                        _didIteratorError3 = true;
                        _iteratorError3 = context$2$0.t0;

                    case 25:
                        context$2$0.prev = 25;
                        context$2$0.prev = 26;

                        if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                            _iterator3['return']();
                        }

                    case 28:
                        context$2$0.prev = 28;

                        if (!_didIteratorError3) {
                            context$2$0.next = 31;
                            break;
                        }

                        throw _iteratorError3;

                    case 31:
                        return context$2$0.finish(28);

                    case 32:
                        return context$2$0.finish(25);

                    case 33:
                        process.on('SIGINT', this.exitHandler.bind(this));

                        /**
                         * make sure the program will not close instantly
                         */
                        process.stdin.resume();

                        context$2$0.next = 37;
                        return _regeneratorRuntime.awrap(new _Promise(function (resolve) {
                            _this.resolve = resolve;
                            _this.runSpecs();
                        }));

                    case 37:
                        exitCode = context$2$0.sent;
                        context$2$0.next = 40;
                        return _regeneratorRuntime.awrap(this.runServiceHook(launcher, 'onComplete', exitCode));

                    case 40:
                        context$2$0.next = 42;
                        return _regeneratorRuntime.awrap(config.onComplete(exitCode));

                    case 42:
                        return context$2$0.abrupt('return', exitCode);

                    case 43:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this, [[17, 21, 25, 33], [26,, 28, 32]]);
        }

        /**
         * run service launch sequences
         */
    }, {
        key: 'runServiceHook',
        value: function runServiceHook(launcher, hookName) {
            for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }

            return _regeneratorRuntime.async(function runServiceHook$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.prev = 0;
                        context$2$0.next = 3;
                        return _regeneratorRuntime.awrap(_Promise.all(launcher.map(function (service) {
                            if (typeof service[hookName] === 'function') {
                                return service[hookName].apply(service, args);
                            }
                        })));

                    case 3:
                        return context$2$0.abrupt('return', context$2$0.sent);

                    case 6:
                        context$2$0.prev = 6;
                        context$2$0.t0 = context$2$0['catch'](0);

                        console.error('A service failed in the \'' + hookName + '\' hook\n' + context$2$0.t0.stack + '\n\nContinue...');

                    case 9:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this, [[0, 6]]);
        }

        /**
         * run multiple single remote tests
         * @return {Boolean} true if all specs have been run and all instances have finished
         */
    }, {
        key: 'runSpecs',
        value: function runSpecs() {
            var _this2 = this;

            var config = this.configParser.getConfig();

            while (this.getNumberOfRunningInstances() < config.maxInstances) {
                var schedulableCaps = this.schedule
                /**
                 * make sure complete number of running instances is not higher than general maxInstances number
                 */
                .filter(function (a) {
                    return _this2.getNumberOfRunningInstances() < config.maxInstances;
                })
                /**
                 * make sure the capabiltiy has available capacities
                 */
                .filter(function (a) {
                    return a.availableInstances > 0;
                })
                /**
                 * make sure capabiltiy has still caps to run
                 */
                .filter(function (a) {
                    return a.specs.length > 0;
                })
                /**
                 * make sure we are running caps with less running instances first
                 */
                .sort(function (a, b) {
                    return a.runningInstances > b.runningInstances;
                });

                /**
                 * continue if no capabiltiy were schedulable
                 */
                if (schedulableCaps.length === 0) {
                    break;
                }

                this.startInstance([schedulableCaps[0].specs.pop()], schedulableCaps[0].caps, schedulableCaps[0].cid);
                schedulableCaps[0].availableInstances--;
                schedulableCaps[0].runningInstances++;
            }

            return this.getNumberOfRunningInstances() === 0 && this.getNumberOfSpecsLeft() === 0;
        }

        /**
         * gets number of all running instances
         * @return {number} number of running instances
         */
    }, {
        key: 'getNumberOfRunningInstances',
        value: function getNumberOfRunningInstances() {
            return this.schedule.map(function (a) {
                return a.runningInstances;
            }).reduce(function (a, b) {
                return a + b;
            });
        }

        /**
         * get number of total specs left to complete whole suites
         * @return {number} specs left to complete suite
         */
    }, {
        key: 'getNumberOfSpecsLeft',
        value: function getNumberOfSpecsLeft() {
            return this.schedule.map(function (a) {
                return a.specs.length;
            }).reduce(function (a, b) {
                return a + b;
            });
        }

        /**
         * Start instance in a child process.
         * @param  {Array} specs  Specs to run
         * @param  {Number} cid  Capabilities ID
         */
    }, {
        key: 'startInstance',
        value: function startInstance(specs, caps, cid) {
            var childProcess = _child_process2['default'].fork(__dirname + '/runner.js', process.argv.slice(2), {
                cwd: process.cwd()
            });

            this.processes.push(childProcess);

            childProcess.on('message', this.messageHandler.bind(this)).on('exit', this.endHandler.bind(this, cid));

            childProcess.send({
                cid: cid,
                command: 'run',
                configFile: this.configFile,
                argv: this.argv,
                caps: caps,
                specs: specs,
                isMultiremote: this.isMultiremote()
            });
        }

        /**
         * emit event from child process to reporter
         * @param  {Object} m  event object
         */
    }, {
        key: 'messageHandler',
        value: function messageHandler(m) {
            this.hasStartedAnyProcess = true;

            if (m.event === 'runner:error') {
                this.reporters.handleEvent('error', m);
            }

            this.reporters.handleEvent(m.event, m);
        }

        /**
         * Close test runner process once all child processes have exited
         * @param  {Number} cid  Capabilities ID
         * @param  {Number} childProcessExitCode  exit code of child process
         */
    }, {
        key: 'endHandler',
        value: function endHandler(cid, childProcessExitCode) {
            this.exitCode = this.exitCode || childProcessExitCode;

            // Update schedule now this process has ended
            if (!this.isMultiremote()) {
                this.schedule[cid].availableInstances++;
                this.schedule[cid].runningInstances--;
            }

            if (!this.isMultiremote() && !this.runSpecs()) {
                return;
            }

            this.reporters.handleEvent('end', {
                sigint: this.hasTriggeredExitRoutine,
                exitCode: this.exitCode
            });

            if (this.exitCode === 0) {
                return this.resolve(this.exitCode);
            }

            /**
             * finish with exit code 1
             */
            return this.resolve(1);
        }

        /**
         * Make sure all started selenium sessions get closed properly and prevent
         * having dead driver processes. To do so let the runner end its Selenium
         * session first before killing
         */
    }, {
        key: 'exitHandler',
        value: function exitHandler() {
            if (this.hasTriggeredExitRoutine || !this.hasStartedAnyProcess) {
                console.log('\nKilling process, bye!');

                /**
                 * finish with exit code 1
                 */
                return this.resolve(1);
            }

            // When spawned as a subprocess,
            // SIGINT will not be forwarded to childs.
            // Thus for the child to exit cleanly, we must force send SIGINT
            if (!process.stdin.isTTY) {
                this.processes.forEach(function (p) {
                    return p.kill('SIGINT');
                });
            }

            console.log('\n\nEnd selenium sessions properly ...\n(press crtl+c again to hard kill the runner)\n');

            this.hasTriggeredExitRoutine = true;
        }

        /**
         * loads launch services
         */
    }, {
        key: 'getLauncher',
        value: function getLauncher(config) {
            var launchServices = [];

            if (!Array.isArray(config.services)) {
                return launchServices;
            }

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(config.services), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var serviceName = _step4.value;

                    var service = undefined;

                    /**
                     * allow custom services
                     */
                    if (typeof serviceName === 'object') {
                        launchServices.push(serviceName);
                        continue;
                    }

                    try {
                        service = require('wdio-' + serviceName + '-service/launcher');
                    } catch (e) {}

                    if (service && (typeof service.onPrepare === 'function' || typeof service.onPrepare === 'function')) {
                        launchServices.push(service);
                    }
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                        _iterator4['return']();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            return launchServices;
        }
    }]);

    return Launcher;
})();

exports['default'] = Launcher;
module.exports = exports['default'];

/**
 * if it is an object run multiremote test
 */

/**
 * schedule test runs
 */

/**
 * run onComplete hook
 */
