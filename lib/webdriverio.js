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
        lastPromise = lastPromise || Q();

        client.desiredCapabilities = desiredCapabilities;
        client.requestHandler = requestHandler;

        /**
         * actual bind function
         */
        client.next = function (func, args) {
            lastPromise.finally(resolve.bind(null, safeExecute(func, args)));
        };

        var resolve = function(result) {
            if(typeof result === 'function') {
                result = result.call(client);
            }

            return client.defer.resolve(result);
        };

        client.finally = function(callback) {
            lastPromise.finally(callback.bind(this));
            return client;
        };
        client.then = function(onFulfilled, onRejected) {
            var self = this,
                defer = Q.defer();

            /**
             * - need to be then to access result
             * - could get shortened by using original bind method (bind(func, args) return func.apply(undefined, args))
             */
            lastPromise.then(function() {
                return defer.resolve(safeExecute(onFulfilled, arguments).apply(self));
            }, function() {
                return defer.reject(safeExecute(onRejected, arguments).apply(self));
            });

            return unit(defer.promise);
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
            options = modifier(client, options, lastPromise);
        }

        return client;
    }

    unit.lift = function (name, func) {
        prototype[name] = function () {
            this.next(func, arguments);
            return unit(this.promise);
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