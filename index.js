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
    ErrorHandler   = require('./lib/utils/ErrorHandler'),
    package = require('./package.json'),
    path = require('path'),
    fs = require('fs');

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
    ['protocol', 'commands'].forEach(function(commandType) {
        var dir = path.join(__dirname, 'lib', commandType),
            files = fs.readdirSync(dir);

        files.forEach(function(filename) {
            var commandName = filename.slice(0, -3);
            wdio.lift(commandName, require(path.join(dir, filename)));
        });
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