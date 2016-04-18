'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _utilsRequestHandler = require('./utils/RequestHandler');

var _utilsRequestHandler2 = _interopRequireDefault(_utilsRequestHandler);

var _utilsErrorHandler = require('./utils/ErrorHandler');

var _utilsLogger = require('./utils/Logger');

var _utilsLogger2 = _interopRequireDefault(_utilsLogger);

var _helpersSafeExecute = require('./helpers/safeExecute');

var _helpersSafeExecute2 = _interopRequireDefault(_helpersSafeExecute);

var _helpersSanitize = require('./helpers/sanitize');

var _helpersSanitize2 = _interopRequireDefault(_helpersSanitize);

var _helpersMobileDetector = require('./helpers/mobileDetector');

var _helpersMobileDetector2 = _interopRequireDefault(_helpersMobileDetector);

var _helpersDetectSeleniumBackend = require('./helpers/detectSeleniumBackend');

var _helpersDetectSeleniumBackend2 = _interopRequireDefault(_helpersDetectSeleniumBackend);

var _helpersErrorHandler = require('./helpers/errorHandler');

var _helpersErrorHandler2 = _interopRequireDefault(_helpersErrorHandler);

var _helpersHasElementResultHelper = require('./helpers/hasElementResultHelper');

var _helpersHasElementResultHelper2 = _interopRequireDefault(_helpersHasElementResultHelper);

var INTERNAL_EVENTS = ['init', 'command', 'error', 'result', 'end'];
var PROMISE_FUNCTIONS = ['then', 'catch', 'finally'];

var EventEmitter = _events2['default'].EventEmitter;

/**
 * WebdriverIO v4
 */
var WebdriverIO = function WebdriverIO(args, modifier) {
    var prototype = _Object$create(Object.prototype);
    var eventHandler = new EventEmitter();
    var fulFilledPromise = (0, _q2['default'])();
    var stacktrace = [];
    var commandList = [];

    var EVENTHANDLER_FUNCTIONS = Object.getPrototypeOf(eventHandler);

    /**
     * merge default options with given user options
     */
    var options = (0, _deepmerge2['default'])({
        protocol: 'http',
        waitforTimeout: 500,
        waitforInterval: 250,
        coloredLogs: true,
        logLevel: 'silent',
        baseUrl: null,
        onError: [],
        connectionRetryTimeout: 90000,
        connectionRetryCount: 3
    }, typeof args !== 'string' ? args : {});

    /**
     * define Selenium backend given on user options
     */
    options = (0, _deepmerge2['default'])((0, _helpersDetectSeleniumBackend2['default'])(args), options);

    /**
     * only set globals we wouldn't get otherwise
     */
    if (!process.env.WEBDRIVERIO_COLORED_LOGS) {
        process.env.WEBDRIVERIO_COLORED_LOGS = options.coloredLogs;
    }

    var logger = new _utilsLogger2['default'](options, eventHandler);
    var requestHandler = new _utilsRequestHandler2['default'](options, eventHandler, logger);

    /**
     * assign instance to existing session
     */
    if (typeof args === 'string') {
        requestHandler.sessionID = args;
    }

    /**
     * sanitize error handler
     */
    if (!Array.isArray(options.onError)) {
        options.onError = [options.onError];
    }
    options.onError = options.onError.filter(function (fn) {
        return typeof fn === 'function';
    });

    var desiredCapabilities = (0, _deepmerge2['default'])({
        javascriptEnabled: true,
        locationContextEnabled: true,
        handlesAlerts: true,
        rotatable: true
    }, options.desiredCapabilities || {});

    /**
     * if no caps are specified fall back to firefox
     */
    if (!desiredCapabilities.browserName && !desiredCapabilities.app) {
        desiredCapabilities.browserName = 'firefox';
    }

    var _mobileDetector = (0, _helpersMobileDetector2['default'])(desiredCapabilities);

    var isMobile = _mobileDetector.isMobile;
    var isIOS = _mobileDetector.isIOS;
    var isAndroid = _mobileDetector.isAndroid;

    if (!isMobile && typeof desiredCapabilities.loggingPrefs === 'undefined') {
        desiredCapabilities.loggingPrefs = {
            browser: 'ALL',
            driver: 'ALL'
        };
    }

    var resolve = function resolve(result, onFulfilled, onRejected, context) {
        var _this = this;

        if (typeof result === 'function') {
            this.isExecuted = true;
            result = result.call(this);
        }

        /**
         * run error handler if command fails
         */
        if (result instanceof Error) {
            (function () {
                var _result = result;

                _this.defer.resolve(_Promise.all(_helpersErrorHandler2['default'].map(function (fn) {
                    return fn.call(context, result);
                })).then(function (res) {
                    var handlerResponses = res.filter(function (r) {
                        return typeof r !== 'undefined';
                    });

                    /**
                     * if no handler was triggered trough actual error
                     */
                    if (handlerResponses.length === 0) {
                        return callErrorHandlerAndReject.call(context, _result, onRejected);
                    }

                    return onFulfilled.call(context, handlerResponses[0]);
                }, function (e) {
                    return callErrorHandlerAndReject.call(context, e, onRejected);
                }));
            })();
        } else {
            this.defer.resolve(result);
        }

        return this.promise;
    };

    /**
     * middleware to call on error handler in wdio mode
     */
    var callErrorHandlerAndReject = function callErrorHandlerAndReject(err, onRejected) {
        var _this2 = this;

        /**
         * only call error handler if there is any and if error has bubbled up
         */
        if (!this || this.depth !== 0 || options.onError.length === 0) {
            return reject.call(this, err, onRejected);
        }

        return new _Promise(function (resolve, reject) {
            return _Promise.all(options.onError.map(function (fn) {
                if (!global.wdioSync) {
                    return fn.call(_this2, err);
                }

                return new _Promise(function (r) {
                    return global.wdioSync(fn, r).call(_this2, err);
                });
            })).then(resolve, reject);
        }).then(function () {
            return reject.call(_this2, err, onRejected);
        });
    };

    /**
     * By using finally in our next method we omit the duty to throw an exception at some
     * point. To avoid propagating rejected promises until everything crashes silently we
     * check if the last and current promise got rejected. If so we can throw the error.
     */
    var reject = function reject(err, onRejected) {
        if (!options.isWDIO && typeof onRejected === 'function') {
            delete err.screenshot;
            return onRejected(err);
        } else if (typeof onRejected === 'function') {
            onRejected(err);
        }

        if (!this) {
            throw err;
        } else if (this.depth !== 0) {
            return this.promise;
        }

        /**
         * take screenshot only if screenshotPath is given
         */
        if (typeof options.screenshotPath !== 'string') {
            return throwException(err, stacktrace);
        }

        var screenshotPath = _path2['default'].isAbsolute(options.screenshotPath) ? options.screenshotPath : _path2['default'].join(process.cwd(), options.screenshotPath);

        /**
        * create directory if not existing
        */
        try {
            _fs2['default'].statSync(screenshotPath);
        } catch (e) {
            _mkdirp2['default'].sync(screenshotPath);
        }

        var client = unit();
        var capId = _helpersSanitize2['default'].caps(desiredCapabilities);
        var timestamp = new Date().toJSON().replace(/:/g, '-');
        var fileName = 'ERROR_' + capId + '_' + timestamp + '.png';
        var filePath = _path2['default'].join(screenshotPath, fileName);

        /**
         * don't take a new screenshot if we already got one from Selenium
         */
        if (typeof err.screenshot === 'string') {
            var screenshot = new Buffer(err.screenshot, 'base64');
            _fs2['default'].writeFileSync(filePath, screenshot);
        } else {
            client.next(prototype.saveScreenshot, [filePath], 'saveScreenshot');
        }
        this.logger.log('\tSaved screenshot: ' + fileName);
        this.emit('screenshot', {
            data: err.screenshot,
            filename: fileName,
            path: filePath
        });

        var stack = stacktrace.slice();
        return throwException(err, stack);
    };

    function throwException(e, stack) {
        if (!e.stack) {
            throw new Error(e);
        }

        stack = stack.map(function (trace) {
            return '    at ' + trace;
        });
        e.stack = e.type + ': ' + e.message + '\n' + stack.reverse().join('\n');

        /**
         * ToDo useful feature for standalone mode:
         * option that if true causes script to throw exception if command fails:
         *
         * process.nextTick(() => {
         *     throw e
         * })
         */

        throw e;
    }

    /**
     * WebdriverIO Monad
     */
    function unit(lastPromise) {
        var client = _Object$create(prototype);
        var defer = _q2['default'].defer();
        var promise = defer.promise;

        client.defer = defer;
        client.promise = promise;
        client.lastPromise = lastPromise || fulFilledPromise;

        client.desiredCapabilities = desiredCapabilities;
        client.requestHandler = requestHandler;
        client.logger = logger;
        client.options = options;
        client.commandList = commandList;

        client.isMobile = isMobile;
        client.isIOS = isIOS;
        client.isAndroid = isAndroid;

        /**
         * actual bind function
         */
        client.next = function (func, args, name) {
            var _this3 = this;

            /**
             * use finally to propagate rejected promises up the chain
             */
            return this.lastPromise.then(function (val) {
                /**
                 * store command into command list so `getHistory` can return it
                 */
                commandList.push({ name: name, args: args });

                /**
                 * allow user to leave out selector argument if they have already queried an element before
                 */
                var lastResult = val || _this3.lastResult;
                if ((0, _helpersHasElementResultHelper2['default'])(lastResult) && args.length < func.length && func.toString().indexOf('function ' + name + '(selector') === 0) {
                    if (lastResult.selector && name === 'waitForExist') {
                        _this3.lastResult = null;
                        args.unshift(lastResult.selector);
                    } else {
                        args.unshift(null);
                    }
                }

                return resolve.call(_this3, (0, _helpersSafeExecute2['default'])(func, args));
            }, function (e) {
                /**
                 * this will get reached only in standalone mode if the command
                 * fails and doesn't get followed by a then or catch method
                 */
                return resolve.call(_this3, e, null, null, { depth: 0 });
            });
        };

        client['finally'] = function (fn) {
            var _this4 = this;

            var client = unit(this.promise['finally'](function () {
                return resolve.call(client, (0, _helpersSafeExecute2['default'])(fn, []).bind(_this4));
            }));
            return client;
        };

        client.call = function (fn) {
            var _this5 = this;

            var client = unit(this.promise.done(function () {
                return resolve.call(client, (0, _helpersSafeExecute2['default'])(fn, []).bind(_this5));
            }));
            return client;
        };

        client.then = function (onFulfilled, onRejected) {
            var _this6 = this;

            if (typeof onFulfilled !== 'function' && typeof onRejected !== 'function') {
                return this;
            }

            /**
             * execute then function in context of the new instance
             * but resolve result with this
             */
            var client = unit(this.promise.then(function () {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                /**
                 * store result in commandList
                 */
                if (commandList.length) {
                    commandList[commandList.length - 1].result = args[0];
                }

                /**
                 * resolve command
                 */
                return resolve.call(client, (0, _helpersSafeExecute2['default'])(onFulfilled, args).bind(_this6));
            }, function (e) {
                var result = (0, _helpersSafeExecute2['default'])(onRejected, [e]).bind(_this6);

                /**
                 * handle error once command was bubbled up the command chain
                 */
                if (_this6.depth === 0) {
                    result = e;
                }

                return resolve.call(client, result, onFulfilled, onRejected, _this6);
            }));

            return client;
        };

        client['catch'] = function (onRejected) {
            return this.then(undefined, onRejected);
        };

        client.inspect = function () {
            return this.promise.inspect();
        };

        /**
         * internal helper method to handle command results
         *
         * @param  {Promise[]} promises  list of promises
         * @param  {Boolean}   option    if true extract value property from selenium result
         */
        client.unify = function (promises, option) {
            option = option || {};
            promises = Array.isArray(promises) ? promises : [promises];

            return _Promise.all(promises)
            /**
             * extract value property from result if desired
             */
            .then(function (result) {
                if (!option.extractValue || !Array.isArray(result)) {
                    return result;
                }

                return result.map(function (res) {
                    return res.value && typeof res.value === 'string' ? res.value.trim() : res.value;
                });

                /**
                 * sanitize result for better assertion
                 */
            }).then(function (result) {
                if (Array.isArray(result) && result.length === 1) {
                    result = result[0];
                }

                if (option.lowercase && typeof result === 'string') {
                    result = result.toLowerCase();
                }

                return result;
            });
        };

        client.addCommand = function (fnName, fn, forceOverwrite) {
            if (typeof fn === 'string') {
                var namespace = arguments[0];
                fnName = arguments[1];
                fn = arguments[2];
                forceOverwrite = arguments[3];

                switch (typeof client[namespace]) {
                    case 'function':
                        throw new _utilsErrorHandler.RuntimeError('Command namespace "' + namespace + '" is used internally, and can\'t be overwritten!');
                    case 'object':
                        if (client[namespace][fnName] && !forceOverwrite) {
                            throw new _utilsErrorHandler.RuntimeError('Command "' + fnName + '" is already defined!');
                        }
                        break;
                }
                return unit.lift(namespace, fnName, fn);
            }

            if (client[fnName] && !forceOverwrite) {
                throw new _utilsErrorHandler.RuntimeError('Command "' + fnName + '" is already defined!');
            }
            return unit.lift(fnName, fn);
        };

        client.getPrototype = function () {
            return prototype;
        };

        client.transferPromiseness = function (target, promise) {
            /**
             * transfer WebdriverIO commands
             */
            var clientFunctions = _Object$keys(prototype);
            var functionsToTranfer = clientFunctions.concat(PROMISE_FUNCTIONS);

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(functionsToTranfer), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var fnName = _step.value;

                    if (typeof promise[fnName] === 'function') {
                        target[fnName] = promise[fnName].bind(promise);
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
        };

        if (typeof modifier === 'function') {
            client = modifier(client, options);
        }

        return client;
    }

    /**
     * enhance base monad prototype with methods
     */
    unit.lift = function (name, func) {
        var commandGroup = prototype;

        if (typeof func === 'string') {
            var namespace = arguments[0];
            name = arguments[1];
            func = arguments[2];

            if (!prototype[namespace]) {
                prototype[namespace] = {};
            }

            commandGroup = prototype[namespace];
        }

        commandGroup[name] = function () {
            var nextPromise = this.promise;

            /**
             * commands executed inside commands don't have to wait
             * on any promise
             */
            if (this.isExecuted) {
                nextPromise = this.lastPromise;
            }

            var client = unit(nextPromise);

            /**
             * catch stack to find information about where the command that causes
             * the error was used (stack line 2) and only save it when it was not
             * within WebdriverIO context
             */
            var stack = new Error().stack;
            var lineInTest = stack.split('\n').slice(2, 3).join('\n');
            var fileAndPosition = lineInTest.slice(lineInTest.indexOf('(') + 1, lineInTest.indexOf(')'));
            var atCommand = lineInTest.trim().slice(3).split(' ')[0];

            atCommand = atCommand.slice(atCommand.lastIndexOf('.') + 1);

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            var trace = name + '(' + _helpersSanitize2['default'].args(args) + ') - ' + fileAndPosition.slice(fileAndPosition.lastIndexOf('/') + 1);
            if (_Object$keys(prototype).indexOf(atCommand) === -1 && atCommand !== 'exports') {
                stacktrace = [trace];
            } else {
                /**
                 * save trace for nested commands
                 */
                stacktrace.push(trace);
            }

            /**
             * determine execution depth:
             * This little tweak helps us to determine whether the command was executed
             * by the test script or by another command. With that we can make sure
             * that errors are getting thrown once they bubbled up the command chain.
             */
            client.depth = stack.split('\n').filter(function (line) {
                return !!line.match(/\/lib\/(commands|protocol)\/(\w+)\.js/);
            }).length;

            /**
             * queue command
             */
            client.name = name;
            client.lastResult = this.lastResult;
            client.next(func, args, name);
            return client;
        };

        return unit;
    };

    /**
     * register event emitter
     */

    var _loop = function (eventCommand) {
        prototype[eventCommand] = function () {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            /**
             * custom commands needs to get emitted and registered in order
             * to prevent race conditions
             */
            if (INTERNAL_EVENTS.indexOf(args[0]) === -1) {
                return this['finally'](function () {
                    return eventHandler[eventCommand].apply(eventHandler, args);
                });
            }

            eventHandler[eventCommand].apply(eventHandler, args);
            return this;
        };
    };

    for (var eventCommand in EVENTHANDLER_FUNCTIONS) {
        _loop(eventCommand);
    }

    return unit;
};

exports['default'] = WebdriverIO;
module.exports = exports['default'];
