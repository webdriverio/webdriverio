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

var fs             = require('fs'),
    log            = require('./utils/log'),
    extend         = require('./utils/extend'),
    QueueItem      = require('./utils/QueueItem'),
    CommandLoader  = require('./utils/CommandLoader'),
    RequestHandler = require('./utils/RequestHandler');

var WebdriverJs = module.exports = function(options) {

    'use strict';

    var self = this;

    options = options || {};

    this.chain = true;
    this.sessionId = null;
    this.queueIsRunning = false;

    this.desiredCapabilities = {
        browserName: "firefox",
        version: "",
        javascriptEnabled: true,
        platform: "ANY"
    };

    if (options.desiredCapabilities) {
        this.desiredCapabilities = extend(this.desiredCapabilities, options.desiredCapabilities);
    }

    if (options && options.username && options.accessKey) {
        this._authString = options.username+":"+options.accessKey;
    }

    // create the first item of the queue, ie the root
    var rootItem = new QueueItem("root", "none", this, []);
    // mark it as the current context
    this.currentQueueItem = rootItem;

    // create CommandLoader and load implemented webdriverjs commands
    var customCommands = {};
    if(options.hasOwnProperty('customCommands')){
        customCommands = options.customCommands;
    }
    this.commandLoader = new CommandLoader(this, customCommands);
    this.commandLoader.load(['protocol','commands']);

    // create request handler
    this.requestHandler = new RequestHandler(options);

    // init log module
    this.log = log({logLevel: options.logLevel || 'verbose'});

};

// this funciton is an entry point for adding new commands 
WebdriverJs.prototype.addCommand = function(commandName, command) {
    
    if (this[commandName]) {
        throw "The command '" + commandName + "' is already defined!";
    }

    this[commandName] = this.commandLoader.addQueueItem(command,commandName,true);

    return this;
};

// saves screenshot to file
WebdriverJs.prototype.writeFile = function(fileName, data, callback) {
    fs.writeFileSync(fileName, data, "base64", function(err) {
        callback(err);
    });
};
