'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _utilsConfigParser = require('./utils/ConfigParser');

var _utilsConfigParser2 = _interopRequireDefault(_utilsConfigParser);

var _ = require('../');

var Runner = (function () {
    function Runner() {
        _classCallCheck(this, Runner);

        this.haltSIGINT = false;
        this.sigintWasCalled = false;
        this.hasSessionID = false;
        this.failures = 0;
    }

    _createClass(Runner, [{
        key: 'run',
        value: function run(m) {
            var config, res;
            return _regeneratorRuntime.async(function run$(context$2$0) {
                var _this = this;

                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        this.cid = m.cid;
                        this.specs = m.specs;
                        this.caps = m.caps;

                        this.configParser = new _utilsConfigParser2['default']();
                        this.configParser.addConfigFile(m.configFile);
                        this.configParser.merge(m.argv);

                        this.currentTest = undefined;

                        config = this.configParser.getConfig();

                        this.addCommandHooks(config);
                        this.initialiseServices(config);

                        this.framework = this.initialiseFramework(config);
                        global.browser = this.initialiseInstance(m.isMultiremote, this.caps);
                        this.initialisePlugins(config);

                        /**
                         * store end method before it gets fiberised by wdio-sync
                         */
                        this.endSession = global.browser.end.bind(global.browser);

                        /**
                         * initialisation successful, send start message
                         */
                        process.send({
                            event: 'runner:start',
                            cid: m.cid,
                            specs: m.specs,
                            capabilities: this.caps,
                            config: config
                        });

                        /**
                         * register runner events
                         */
                        global.browser.on('init', function (payload) {
                            process.send({
                                event: 'runner:init',
                                cid: m.cid,
                                specs: _this.specs,
                                sessionID: payload.sessionID,
                                options: payload.options,
                                desiredCapabilities: payload.desiredCapabilities
                            });

                            _this.hasSessionID = true;
                        });

                        global.browser.on('command', function (payload) {
                            var command = {
                                event: 'runner:command',
                                cid: m.cid,
                                specs: _this.specs,
                                method: payload.method,
                                uri: payload.uri,
                                data: payload.data
                            };
                            process.send(_this.addTestDetails(command));
                        });

                        global.browser.on('result', function (payload) {
                            var result = {
                                event: 'runner:result',
                                cid: m.cid,
                                specs: _this.specs,
                                requestData: payload.requestData,
                                requestOptions: payload.requestOptions,
                                body: payload.body // ToDo figure out if this slows down the execution time
                            };
                            process.send(_this.addTestDetails(result));
                        });

                        global.browser.on('screenshot', function (payload) {
                            var details = {
                                event: 'runner:screenshot',
                                cid: m.cid,
                                specs: _this.specs,
                                filename: payload.filename,
                                data: payload.data
                            };
                            process.send(_this.addTestDetails(details));
                        });

                        global.browser.on('log', function () {
                            for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
                                data[_key] = arguments[_key];
                            }

                            var details = {
                                event: 'runner:log',
                                cid: m.cid,
                                specs: _this.specs,
                                data: data
                            };
                            process.send(_this.addTestDetails(details));
                        });

                        process.on('test:start', function (test) {
                            _this.currentTest = test;
                        });

                        global.browser.on('error', function (payload) {
                            process.send({
                                event: 'runner:error',
                                cid: m.cid,
                                specs: _this.specs,
                                error: payload,
                                capabilities: _this.caps
                            });
                        });

                        this.haltSIGINT = true;

                        context$2$0.prev = 23;
                        context$2$0.next = 26;
                        return _regeneratorRuntime.awrap(global.browser.init());

                    case 26:
                        res = context$2$0.sent;

                        global.browser.sessionId = res.sessionId;
                        this.haltSIGINT = false;

                        /**
                         * make sure init and end can't get called again
                         */
                        global.browser.options.isWDIO = true;

                        /**
                         * kill session of SIGINT signal showed up while trying to
                         * get a session ID
                         */

                        if (!this.sigintWasCalled) {
                            context$2$0.next = 33;
                            break;
                        }

                        context$2$0.next = 33;
                        return _regeneratorRuntime.awrap(this.end(1));

                    case 33:
                        context$2$0.next = 35;
                        return _regeneratorRuntime.awrap(this.framework.run(m.cid, config, m.specs, this.caps));

                    case 35:
                        this.failures = context$2$0.sent;
                        context$2$0.next = 38;
                        return _regeneratorRuntime.awrap(this.end(this.failures));

                    case 38:
                        context$2$0.next = 45;
                        break;

                    case 40:
                        context$2$0.prev = 40;
                        context$2$0.t0 = context$2$0['catch'](23);

                        process.send({
                            event: 'error',
                            cid: this.cid,
                            specs: this.specs,
                            capabilities: this.caps,
                            error: {
                                message: context$2$0.t0.message,
                                stack: context$2$0.t0.stack
                            }
                        });

                        context$2$0.next = 45;
                        return _regeneratorRuntime.awrap(this.end(1));

                    case 45:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this, [[23, 40]]);
        }

        /**
         * end test runner instance and exit process
         */
    }, {
        key: 'end',
        value: function end() {
            var failures = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
            return _regeneratorRuntime.async(function end$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (!this.hasSessionID) {
                            context$2$0.next = 4;
                            break;
                        }

                        global.browser.options.isWDIO = false;
                        context$2$0.next = 4;
                        return _regeneratorRuntime.awrap(this.endSession());

                    case 4:

                        process.send({
                            event: 'runner:end',
                            failures: failures,
                            cid: this.cid,
                            specs: this.specs
                        });
                        process.exit(failures === 0 ? 0 : 1);

                    case 6:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: 'addTestDetails',
        value: function addTestDetails(payload) {
            if (this.currentTest) {
                payload.title = this.currentTest.title;
                payload.parent = this.currentTest.parent;
            }
            return payload;
        }
    }, {
        key: 'addCommandHooks',
        value: function addCommandHooks(config) {
            var _this2 = this;

            config.beforeCommand.push(function (command, args) {
                var payload = {
                    event: 'runner:beforecommand',
                    cid: _this2.cid,
                    specs: _this2.specs,
                    command: command,
                    args: args
                };
                process.send(_this2.addTestDetails(payload));
            });
            config.afterCommand.push(function (command, args, result, err) {
                var payload = {
                    event: 'runner:aftercommand',
                    cid: _this2.cid,
                    specs: _this2.specs,
                    command: command,
                    args: args,
                    result: result,
                    err: err
                };
                process.send(_this2.addTestDetails(payload));
            });
        }
    }, {
        key: 'sigintHandler',
        value: function sigintHandler() {
            if (this.sigintWasCalled) {
                return;
            }

            this.sigintWasCalled = true;

            if (this.haltSIGINT) {
                return;
            }

            global.browser.removeAllListeners();
            this.end(1);
        }
    }, {
        key: 'initialiseFramework',
        value: function initialiseFramework(config) {
            if (typeof config.framework !== 'string') {
                throw new Error('You haven\'t defined a valid framework. ' + 'Please checkout http://webdriver.io/guide/testrunner/frameworks.html');
            }

            var frameworkLibrary = 'wdio-' + config.framework.toLowerCase() + '-framework';
            try {
                return require(frameworkLibrary).adapterFactory;
            } catch (e) {
                if (!e.message.match('Cannot find module \'' + frameworkLibrary + '\'')) {
                    throw new Error('Couldn\'t initialise framework "' + frameworkLibrary + '".\n' + e.stack);
                }

                throw new Error('Couldn\'t load "' + frameworkLibrary + '" framework. You need to install ' + ('it with `$ npm install ' + frameworkLibrary + '`!\n' + e.stack));
            }
        }
    }, {
        key: 'initialiseInstance',
        value: function initialiseInstance(isMultiremote, capabilities) {
            var config = this.configParser.getConfig();

            if (!isMultiremote) {
                config.desiredCapabilities = capabilities;
                return (0, _.remote)(config);
            }

            var options = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(_Object$keys(capabilities)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var browserName = _step.value;

                    options[browserName] = (0, _deepmerge2['default'])(config, capabilities[browserName]);
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

            var browser = (0, _.multiremote)(options);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(_Object$keys(capabilities)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var browserName = _step2.value;

                    global[browserName] = browser.select(browserName);
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

            browser.isMultiremote = true;
            return browser;
        }

        /**
         * initialise WebdriverIO compliant plugins
         */
    }, {
        key: 'initialisePlugins',
        value: function initialisePlugins(config) {
            if (typeof config.plugins !== 'object') {
                return;
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(_Object$keys(config.plugins)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var pluginName = _step3.value;

                    var plugin = undefined;

                    try {
                        plugin = require(pluginName);
                    } catch (e) {
                        if (!e.message.match('Cannot find module \'' + pluginName + '\'')) {
                            throw new Error('Couldn\'t initialise service "' + pluginName + '".\n' + e.stack);
                        }

                        throw new Error('Couldn\'t find plugin "' + pluginName + '". You need to install it ' + ('with `$ npm install ' + pluginName + '`!\n' + e.stack));
                    }

                    if (typeof plugin.init !== 'function') {
                        throw new Error('The plugin "' + pluginName + '" is not WebdriverIO compliant!');
                    }

                    plugin.init(global.browser, config.plugins[pluginName]);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                        _iterator3['return']();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }

        /**
         * initialise WebdriverIO compliant services
         */
    }, {
        key: 'initialiseServices',
        value: function initialiseServices(config) {
            if (!Array.isArray(config.services)) {
                return;
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
                        this.configParser.addService(serviceName);
                        continue;
                    }

                    try {
                        service = require('wdio-' + serviceName + '-service');
                    } catch (e) {
                        if (!e.message.match('Cannot find module \'' + serviceName + '\'')) {
                            throw new Error('Couldn\'t initialise service "' + serviceName + '".\n' + e.stack);
                        }

                        throw new Error('Couldn\'t find service "' + serviceName + '". You need to install it ' + ('with `$ npm install wdio-' + serviceName + '-service`!'));
                    }

                    this.configParser.addService(service);
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
        }
    }]);

    return Runner;
})();

var runner = new Runner();

process.on('message', function (m) {
    runner[m.command](m)['catch'](function (e) {
        /**
         * custom exit code to propagate initialisation error
         */
        process.send({
            event: 'runner:error',
            error: {
                message: e.message,
                stack: e.stack
            },
            capabilities: runner.configParser.getCapabilities(runner.cid),
            cid: runner.cid,
            specs: runner.specs
        });
        process.exit(1);
    });
});

/**
 * catches ctrl+c event
 */
process.on('SIGINT', function () {
    runner.sigintHandler();
});
