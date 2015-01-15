/**
 * webdriverio
 * https://github.com/Camme/webdriverio
 *
 * A WebDriver module for nodejs. Either use the super easy help commands or use the base
 * Webdriver wire protocol commands. Its totally inspired by jellyfishs webdriver, but the
 * goal is to make all the webdriver protocol items available, as near the original as possible.
 *
 * Copyright (c) 2013 Camilo Tapia <camilo.tapia@gmail.com>
 * Licensed under the MIT license.
 *
 * Contributors:
 *     Dan Jenkins <dan.jenkins@holidayextras.com>
 *     Christian Bromann <mail@christian-bromann.com>
 *     Vincent Voyer <vincent@zeroload.net>
 */

var createSingleton = require('pragma-singleton'),
    WebdriverIO = require('./lib/webdriverio'),
    Multibrowser = require('./lib/multibrowser')
    ErrorHandler   = require('./lib/utils/ErrorHandler'),
    package = require('./package.json'),
    chainIt = require('chainit'),
    PromiseHandler = require('./lib/utils/PromiseHandler');

// expose version number
module.exports.version = package.version;

// expose error handler
module.exports.ErrorHandler = ErrorHandler;

// use the chained API reference to add static methods
var remote = module.exports.remote = function remote(options, Constructor) {

    if (typeof options === 'function') {
        Constructor = options;
        options = {};
    } else {
        options = options || {};

        /**
         * allows easy webdriverio-$framework creation (like webdriverio-angular)
         */
        Constructor = chainIt(Constructor || WebdriverIO);

        /**
         * fake promise behavior for all commands
         */
        Object.keys(Constructor.prototype).forEach(function(fnName) {
            /**
             * register Multibrowser so the command gets executed like follows
             *
             *     |--->PromiseHandler
             *             |--->Multibrowser
             *                     |--->ChainIt
             *
             * this setup enables calling commands on child processes "synchronously" and having
             * all functionality chainIt provides
             */
            Constructor.prototype[fnName] = PromiseHandler(fnName, Constructor.prototype[fnName]);
        });
    }

    if (options.singleton) {
        var singleton = createSingleton(Constructor);
        return new singleton(options);
    } else {
        return new Constructor(options);
    }
};

module.exports.multiremote = function(options) {
    return remote(options, Multibrowser);
};
