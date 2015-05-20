'use strict';

var q = require('q'),
    merge = require('deepmerge'),
    EventEmitter = require('events').EventEmitter,
    safeExecute = require('./utils/safeExecute'),
    RequestHandler = require('./utils/RequestHandler'),
    Logger = require('./utils/Logger');

/**
 * WebdriverIO v3
 */
module.exports = function WebdriverIO(args, modifier) {

    var prototype = Object.create(Object.prototype),
        eventHandler = new EventEmitter(),
        internalEvents = ['init', 'command', 'error', 'result', 'end'],
        fulFilledPromise = q();

    /**
     * enable user to attach to a running selenium session by
     * passing a selenium session id from type of string
     */
    var options = merge({
        host: '127.0.0.1',
        port: 4444,
        protocol: 'http',
        waitforTimeout: 500,
        coloredLogs: true,
        logLevel: 'silent',
        baseUrl: null
    }, typeof args !== 'string' ? args : {});

    var logger = new Logger(options.logLevel, options.coloredLogs, eventHandler),
        requestHandler = new RequestHandler(options, eventHandler, logger);

    /**
     * assign instance to existing session
     */
    if(typeof args === 'string') {
        requestHandler.sessionID = args;
    }

    /**
     * only set globals we wouldn't get otherwise
     */
    GLOBAL.WDIO_GLOBALS = {
        coloredLogs: options.coloredLogs
    };

    var desiredCapabilities = merge({
        browserName: 'firefox',
        version: '',
        javascriptEnabled: true,
        locationContextEnabled: true,
        handlesAlerts: true,
        rotatable: true,
        platform: 'ANY'
    }, options.desiredCapabilities || {});

    var resolve = function(result, hasExceptionQueue, isRejectionNotHandled) {
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
        if(hasExceptionQueue || (this.promise.isRejected() && this.lastPromise.isRejected())) {

            if(isRejectionNotHandled === false) {
                return;
            }

            return setImmediate(function() {
                throw result;
            });
        }
    };

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
        client.addCommand = unit.lift;

        client.desiredCapabilities = desiredCapabilities;
        client.requestHandler = requestHandler;
        client.logger = logger;
        client.options = options;

        /**
         * actual bind function
         */
        client.next = function (func, args) {
            /**
             * use finally to propagate rejected promises up the chain
             */
            return this.lastPromise.finally(resolve.bind(this, safeExecute(func, args)));
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
            }, function(e) {

                /**
                 * see resolve method for more information.
                 */
                if(self.promise.isRejected() && self.lastPromise.isRejected()) {
                    return resolve.call(client, e, true, !onRejected);
                }

                return resolve.call(client, safeExecute(onRejected, arguments).bind(self));
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
         * @param  {Promise[]} promises      list of promises
         * @param  {Boolean}   extractValue  if true extract value property from selenium result
         */
        client.unify = function(promises, extractValue) {
            promises = Array.isArray(promises) ? promises : [promises];

            return q.all(promises)
                /**
                 * extract value property from result if desired
                 */
                .then(function(result) {

                    if(!extractValue && !Array.isArray(result)) {
                        return result;
                    }

                    return result.map(function(res) {
                        return res.value && typeof res.value === 'string' ? res.value.trim() : res.value;
                    });

                /**
                 * flatten result for better assertion
                 */
                }).then(function(result) {

                    if(Array.isArray(result) && result.length === 1) {
                        return result[0];
                    }

                    return result;

                });
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
            options = modifier(client, options, client.lastPromise);
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
             * since the next method omits promise rejection we need to make
             * sure that we don't continue if a command got rejected
             */
            if(this.lastPromise.isRejected()) {
                this.defer.reject(this.lastPromise.inspect().reason);
                return this;
            }

            /**
             * commands executed inside commands don't have to wait
             * on any promise
             */
            if(this.isExecuted) {
                nextPromise = this.lastPromise;
            }

            var client = unit(nextPromise);

            /**
             * ensure backwards compatibility
             * care about callbacks as last parameter for all commands
             * but execute(Async) and selectExecute(Async)
             */
            if(!name.match(/(selector)*(E|e)xecute(Async)*/) && !name.match(/selectorExecute(Async)*/) && typeof args[args.length - 1] === 'function') {
                callback = args.pop();
                client.next(func, args);
                return client.then(function(res) {
                    return callback.call(this, undefined, res);
                }, function(err) {
                    return callback.call(this, err);
                });
            }

            client.next(func, args);
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
            if(internalEvents.indexOf(eventCommand) === -1) {
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