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

var WebdriverIO = require('./lib/webdriverio'),
    Multibrowser = require('./lib/multibrowser'),
    ErrorHandler = require('./lib/utils/ErrorHandler'),
    implementedCommands = require('./lib/helpers/getImplementedCommands')(),
    package = require('./package.json');

// expose version number
module.exports.version = package.version;

// expose error handler
module.exports.ErrorHandler = ErrorHandler;

// use the chained API reference to add static methods
var remote = module.exports.remote = function remote(options, modifier) {

    options = options || {};

    /**
     * initialise monad
     */
    var wdio = WebdriverIO(options, modifier);

    /**
     * build prototype: commands
     */
    Object.keys(implementedCommands).forEach(function(commandName) {
        wdio.lift(commandName, implementedCommands[commandName]);
    });

    var prototype = wdio();
    prototype.defer.resolve();
    return prototype;
};

module.exports.multiremote = function multiremote(options) {
    var multibrowser = new Multibrowser();

    Object.keys(options).forEach(function(browserName) {
        multibrowser.addInstance(
            browserName,
            remote(options[browserName], multibrowser.getInstanceModifier())
        );
    });

    return remote(options, multibrowser.getModifier());
};
