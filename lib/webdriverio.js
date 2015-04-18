'use strict';

var Q = require('q'),
    util = require('util'),
    merge = require('deepmerge'),
    EventEmitter = require('events').EventEmitter,
    safeExecute = require('./utils/safeExecute'),
    RequestHandler = require('./utils/RequestHandler'),
    Logger = require('./utils/Logger');

/**
 * WebdriverIO v3
 */
var WebdriverIO = module.exports = function WebdriverIO(options) {

    var prototype = Object.create(null),
        eventHandler = new EventEmitter();

    /**
     * enable user to attach to a running selenium session by
     * passing a selenium session id from type of string
     */
    if (typeof options !== 'string') {
        options = merge({
            host: '127.0.0.1',
            port: 4444,
            protocol: 'http',
            waitforTimeout: 500,
            coloredLogs: true,
            logLevel: 'silent'
        }, options);
    }

    var logger = new Logger(options.logLevel, options.coloredLogs, eventHandler),
        requestHandler = new RequestHandler(options, eventHandler, logger);

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

    /**
     * WebdriverIO Monad
     */
    function unit(lastPromise) {

        var client = Object.create(prototype),
            defer = Q.defer(),
            promise = defer.promise;

        client.defer = defer;
        client.promise = promise;
        client.lastPromise = lastPromise || Q();

        client.desiredCapabilities = desiredCapabilities;
        client.requestHandler = requestHandler;

        /**
         * actual bind function
         */
        client.next = function (func, args) {
            /**
             * if last promise is already fulfilled execute promise in the
             * current event loop (enables to have "then" as last method call)
             */
            if(this.lastPromise.inspect().state === 'fulfilled') {
                return resolve.call(this, safeExecute(func, args));
            }

            return this.lastPromise.finally(resolve.bind(this, safeExecute(func, args)));
        };

        var resolve = function(result) {
            if(typeof result === 'function') {
                result = result.call(this);
            }

            this.defer.resolve(result);

            /**
             * return result to propagate promises
             */
            return result;
        };

        client.finally = function(callback) {
            return unit(this.lastPromise.finally(callback.bind(this)));
        };

        client.then = function(onFulfilled, onRejected) {
            var self = this,
                client = unit();

            /**
             * execute then function in context of the new instance
             * but resolve result with this
             */
            return unit(this.lastPromise.then(function() {
                return resolve.call(self, safeExecute(onFulfilled, arguments).bind(client));
            }, function() {
                return resolve.call(self, safeExecute(onRejected, arguments).bind(client));
            }));
        };

        client.catch = function(onRejected) {
            return client.then(null, onRejected);
        };

        client.inspect = function() {
            return this.promise.inspect();
        };

        client.addCommand = function(name, func) {
            prototype[name] = function() {
                this.next(func, arguments);
                return unit(this.promise);
            };

            return this;
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
        prototype[name] = function (a) {
            var client;

            if(this.lastPromise.inspect().state === 'fulfilled') {
                client = unit();
                client.next(func, arguments);
                client.lastPromise = client.promise;
                return client;
            }

            client = unit(this.promise);
            this.next(func, arguments);
            return client;
        };

        return unit;
    };

    /**
     * register event emitter
     */
    Object.keys(eventHandler.__proto__).forEach(function(eventCommand) {
        unit.lift(eventCommand, eventHandler[eventCommand]);
    });

    return unit;
};