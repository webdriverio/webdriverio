'use strict';

var q = require('q'),
    fs = require('fs'),
    path = require('path'),
    merge = require('deepmerge'),
    EventEmitter = require('events').EventEmitter,
    safeExecute = require('./utils/safeExecute'),
    RequestHandler = require('./utils/RequestHandler'),
    ErrorHandler = require('./utils/ErrorHandler'),
    Logger = require('./utils/Logger'),
    sanitize = require('./helpers/sanitize'),
    isMobileHelper = require('./helpers/isMobile'),
    detectSeleniumBackend = require('./helpers/detectSeleniumBackend');

/**
 * WebdriverIO v3
 */
module.exports = function WebdriverIO(args, modifier) {

    var prototype = Object.create(Object.prototype),
        eventHandler = new EventEmitter(),
        internalEvents = ['init', 'command', 'error', 'result', 'end'],
        fulFilledPromise = q(),
        stacktrace = [],
        commandList = [];

    /**
     * merge default options with given user options
     */
    var options = merge({
        protocol: 'http',
        waitforTimeout: 500,
        waitforInterval: 250,
        coloredLogs: true,
        logLevel: 'silent',
        baseUrl: null,
        connectionRetryTimeout: 10000,
        connectionRetryCount: 3
    }, typeof args !== 'string' ? args : {});

    /**
     * define Selenium backend given on user options
     */
    options = merge(detectSeleniumBackend(args), options);

    /**
     * only set globals we wouldn't get otherwise
     */
    if(!process.env.WEBDRIVERIO_COLORED_LOGS) {
        process.env.WEBDRIVERIO_COLORED_LOGS = options.coloredLogs;
    }

    var logger = new Logger(options, eventHandler),
        requestHandler = new RequestHandler(options, eventHandler, logger);

    /**
     * assign instance to existing session
     */
    if(typeof args === 'string') {
        requestHandler.sessionID = args;
    }

    var desiredCapabilities = merge({
        browserName: 'firefox',
        version: '',
        javascriptEnabled: true,
        locationContextEnabled: true,
        handlesAlerts: true,
        rotatable: true,
        platform: 'ANY'
    }, options.desiredCapabilities || {});

    /**
     * set default logging prefs to enable log commands (mainly for chromedriver)
     */
    if(typeof desiredCapabilities.loggingPrefs === 'undefined') {
        desiredCapabilities.loggingPrefs = {
            browser: 'ALL',
            driver: 'ALL'
        };
    }

    var isMobile = isMobileHelper(desiredCapabilities);

    var resolve = function(result, isErrorHandled) {
        if(typeof result === 'function') {
            this.isExecuted = true;
            result = result.call(this);
        }

        var resolveMethod = result instanceof Error ? 'reject' : 'resolve';
        this.defer[resolveMethod](result);

        /**
         * By using finally in our next method we omit the duty to throw an exception an some
         * point. To avoid propagating rejected promises until everything crashes silently we
         * check if the last and current promise got rejected. If so we can throw the error.
         */
        if(this.promise.isRejected() && !isErrorHandled) {

            /**
             * take screenshot only if screenshotPath is given
             */
            if(typeof options.screenshotPath !== 'string') {
                return throwException(result, stacktrace);
            }

            var screenshotPath = path.join(process.cwd(), options.screenshotPath);

            /**
             * take screenshot only if directory exists
             */
            if(!fs.existsSync(screenshotPath)) {
                return throwException(result, stacktrace);
            }

            var client = unit();
            var screenshotName = getScreenshotFilename();
            client.next(prototype.saveScreenshot, [
                path.join(screenshotPath, screenshotName)
            ], 'saveScreenshot');

            this.logger.info('\t' + screenshotName);

            var stack = stacktrace.slice();
            return throwException.bind(null, result, stack);
        }

        return this.promise;
    };

    function getScreenshotFilename() {
        return 'ERROR_' + sanitize.caps(desiredCapabilities) + '_' + new Date().toJSON().replace(/:/g,"-")  + '.png'
    }

    function throwException(e, stack) {
        stack = stack.slice(0, -1).map(function(trace) {
            return '    at ' + trace;
        });
        e.stack = e.type + ': ' + e.message + '\n' + stack.reverse().join('\n');
        throw e;
    }

    /**
     * WebdriverIO Monad
     */
    function unit(lastPromise) {

        var client = Object.create(prototype),
            defer = q.defer(),
            promise = defer.promise;

        client.defer = defer;
        client.promise = promise;
        client.lastPromise = lastPromise || fulFilledPromise;

        client.desiredCapabilities = desiredCapabilities;
        client.requestHandler = requestHandler;
        client.logger = logger;
        client.options = options;
        client.isMobile = isMobile;
        client.commandList = commandList;

        /**
         * actual bind function
         */
        client.next = function (func, args, name) {
            var self = this;

            /**
             * use finally to propagate rejected promises up the chain
             */
            return self.lastPromise.then(function() {
                /**
                 * store command into command list so `getHistory` can return it
                 */
                commandList.push({
                    name: name,
                    args: args
                });

                return resolve.call(self, safeExecute(func, args));
            }, function(e) {

                /**
                 * reject pending commands in chain
                 */
                if(e.isPropagatedError) {
                    return self.defer.reject(e);
                }

                self.emit('error', {
                    message: e.message,
                    type: e.type,
                    stack: stacktrace,
                    err: e.error
                });

                /**
                 * mark error as propagated so that error messages get only printed once
                 */
                e.isPropagatedError = true;
                logger.printException(e.type || 'Error', e.message, stacktrace);
                self.defer.reject(e);
            });
        };

        client.finally = function(fn) {
            var client = unit(this.promise.finally(function() {
                return resolve.call(client, safeExecute(fn, []).bind(this));
            }.bind(this)));
            return client;
        };

        client.call = function(fn) {
            var client = unit(this.promise.done(function() {
                return resolve.call(client, safeExecute(fn, []).bind(this));
            }.bind(this)));
            return client;
        };

        client.then = function(onFulfilled, onRejected) {
            var self = this;

            if(typeof onFulfilled !== 'function' && typeof onRejected !== 'function') {
                return this;
            }

            /**
             * execute then function in context of the new instance
             * but resolve result with this
             */
            var client = unit(this.promise.then(function() {
                return resolve.call(client, safeExecute(onFulfilled, arguments).bind(self));
            }, function() {
                return resolve.call(client, safeExecute(onRejected, arguments).bind(self), typeof onRejected === 'function');
            }));

            return client;
        };

        client.catch = function(onRejected) {
            return this.then(undefined, onRejected);
        };

        client.inspect = function() {
            return this.promise.inspect();
        };

        /**
         * internal helper method to handle command results
         *
         * @param  {Promise[]} promises  list of promises
         * @param  {Boolean}   option    if true extract value property from selenium result
         */
        client.unify = function(promises, option) {
            option = option || {};
            promises = Array.isArray(promises) ? promises : [promises];

            return q.all(promises)
                /**
                 * extract value property from result if desired
                 */
                .then(function(result) {

                    if(!option.extractValue || !Array.isArray(result)) {
                        return result;
                    }

                    return result.map(function(res) {
                        return res.value && typeof res.value === 'string' ? res.value.trim() : res.value;
                    });
                /**
                 * sanitize result for better assertion
                 */
                }).then(function(result) {

                    if(Array.isArray(result) && result.length === 1) {
                        result = result[0];
                    }

                    if(option.lowercase && typeof result === 'string') {
                        result = result.toLowerCase();
                    }

                    return result;

                });
        };

        client.addCommand = function(fnName, fn, forceOverwrite) {
            if(client[fnName] && !forceOverwrite) {
                throw new ErrorHandler.RuntimeError('Command "' + fnName + '" is already defined!');
            }
            return unit.lift.apply(null, arguments);
        };

        client.transferPromiseness = function(target, promise) {
            /**
             * transfer WebdriverIO commands
             */

            var clientFunctions =  Object.keys(prototype);
            var promiseFunctions = ['then', 'catch', 'finally'];
            var functionsToTranfer = clientFunctions.concat(promiseFunctions);

            functionsToTranfer.forEach(function(fnName) {
                if(typeof promise[fnName] === 'function') {
                    target[fnName] = promise[fnName].bind(promise);
                }
            });
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
        prototype[name] = function () {
            var nextPromise = this.promise,
                args = Array.prototype.slice.apply(arguments),
                callback;

            /**
             * commands executed inside commands don't have to wait
             * on any promise
             */
            if(this.isExecuted) {
                nextPromise = this.lastPromise;
            }

            var client = unit(nextPromise);

            /**
             * catch stack to find information about where the command that causes
             * the error was used (stack line 2) and only save it when it was not
             * within WebdriverIO context
             */
            var stack = new Error().stack,
                lineInTest = stack.split('\n').slice(2, 3).join('\n'),
                fileAndPosition = lineInTest.slice(lineInTest.indexOf('(') + 1, lineInTest.indexOf(')')),
                atCommand = lineInTest.trim().slice(3).split(' ')[0];

            atCommand = atCommand.slice(atCommand.lastIndexOf('.') + 1);

            var trace = name + '(' + sanitize.args(args) + ') - ' + fileAndPosition.slice(fileAndPosition.lastIndexOf('/') + 1);
            if(Object.keys(prototype).indexOf(atCommand) === -1 && atCommand !== 'exports') {
                stacktrace = [trace];
            } else {
                /**
                 * save trace for nested commands
                 */
                stacktrace.push(trace);
            }

            /**
             * queue command
             */
            client.next(func, args, name, trace);

            /**
             * ensure backwards compatibility
             * care about callbacks as last parameter for all commands
             * but execute(Async) and selectExecute(Async)
             */
            if(!name.match(/(selector)*(E|e)xecute(Async)*/) && !name.match(/waitUntil/) && typeof args[args.length - 1] === 'function') {
                callback = args.pop();
                return client.then(function(res) {
                    return callback.call(this, undefined, res);
                }, function(err) {
                    return callback.call(this, err);
                });
            }

            return client;
        };

        return unit;
    };

    /**
     * register event emitter
     */
    Object.keys(Object.getPrototypeOf(eventHandler)).forEach(function(eventCommand) {
        prototype[eventCommand] = function() {
            var args = Array.prototype.slice.apply(arguments);

            /**
             * custom commands needs to get emitted and registered in order
             * to prevent race conditions
             */
            if(internalEvents.indexOf(args[0]) === -1) {
                return this.finally(function() {
                    eventHandler[eventCommand].apply(eventHandler, args);
                });
            }

            eventHandler[eventCommand].apply(eventHandler, args);
            return this;
        };
    });

    return unit;
};
