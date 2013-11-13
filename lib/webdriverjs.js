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
 */

var buildPrototype = require('./utils/buildPrototype.js');
var chainIt = require('chainit');
var realPath = require('./utils/realPath.js');

buildPrototype(
    WebdriverJs.prototype,
    ['commands', 'protocol'].map(realPath(__dirname))
);

module.exports = chainIt(WebdriverJs);

function WebdriverJs(options) {
    var merge = require('lodash.merge');
    var log = require('./utils/log.js');
    var RequestHandler = require('./utils/RequestHandler.js');

    options = options || {};

    this.sessionId = null;

    this.desiredCapabilities = merge({
        browserName: "firefox",
        version: "",
        javascriptEnabled: true,
        platform: "ANY"
    }, options.desiredCapabilities || {});

    if (options && options.username && options.accessKey) {
        this._authString = options.username+":"+options.accessKey;
    }

    this.requestHandler = new RequestHandler(options);

    this.log = log({
        logLevel: options.logLevel || 'verbose',
        screenshotPath: options.screenshotPath
    });
};

// saves screenshot to file
WebdriverJs.prototype.writeFile = function writeFile (fileName, data, callback) {
    var fs = require('fs');
    fs.writeFile(fileName, data, "base64", callback);
};