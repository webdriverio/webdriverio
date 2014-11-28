/**
 * webdriverjs
 * https://github.com/Camme/webdriverjs
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
    WebdriverJS = require('./lib/webdriverio.js'),
    ErrorHandler   = require('./lib/utils/ErrorHandler'),
    package = require('./package.json'),
    chainIt = require('chainit'),
    PromiseHandler = require('./lib/utils/PromiseHandler');

// expose version number
module.exports.version = package.version;

// expose error handler
module.exports.ErrorHandler = ErrorHandler;

// use the chained API reference to add static methods
module.exports.remote = function remote(options, Constructor) {
    if (typeof options === 'function') {
        Constructor = options;
        options = {};
    } else {
        options = options || {};

        /**
         * allows easy webdriverjs-$framework creation (like webdriverjs-angular)
         */
        Constructor = chainIt(Constructor || WebdriverJS);

        /**
         * fake promise behavior for all commands
         */
        Object.keys(Constructor.prototype).forEach(function(fnName) {
            /**
             * skip internal commands (e.g. `__addToChain`)
             */
            if(fnName.indexOf('__') === 0) {
                return;
            }

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
