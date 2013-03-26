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

var http = require("http"),

    colors         = require('./utils/colors'),
    errorCodes     = require('./utils/errorCodes'),
    QueueItem      = require('./utils/QueueItem'),
    CommandLoader  = require('./utils/CommandLoader'),
    RequestHandler = require('./utils/RequestHandler'),

    infoHasBeenShown = false;


var WebdriverJs = module.exports = function(options) {

    'use strict';

    var self = this;

    this.chain = true;
    this.sessionId = null;
    this.queuedPaused = false;
    this.queueIsRunning = false;
    this.tests  = {};
    this.assert = {};


    // log level: silent : no logs, command : command only, verbose : command + data
    this.logLevel = options.logLevel || 'verbose';

    // where to save the screenshots. default to current folder
    this.screenshotPath = "";

    //  defaultOptions = self.extend(defaultOptions, options);
    this.desiredCapabilities = {
        browserName: "firefox",
        version: "",
        javascriptEnabled: true,
        platform: "ANY"
    };

    if (options.desiredCapabilities) {
        this.desiredCapabilities = this.extend(this.desiredCapabilities, options.desiredCapabilities);
    }

    if (options && options.username && options.accessKey) {
        this._authString = options.username+":"+options.accessKey;
    }

    // create the first item of the queue, ie the root
    var rootItem = new QueueItem("root", "none", this, []);
    // mark it as the current context
    this.currentQueueItem = rootItem;

    // create CommandLoader and load implemented webdriverjs commands
    this.commandLoader = new CommandLoader(this);
    this.commandLoader.load(['protocol','commands']);
    this.commandLoader.loadType(this.tests,'tests');
    this.commandLoader.loadType(this.assert,'asserts');

    // create request handler
    this.requestHandler = new RequestHandler(this,options);

    if (self.logLevel !== 'silent' && !infoHasBeenShown) {
        console.log("");
        console.log(colors.yellow + "=====================================================================================" + colors.reset);
        console.log("");
        console.log("Selenium 2.0/webdriver protocol bindings implementation with helper commands in nodejs by Camilo Tapia.");
        console.log("For a complete list of commands, visit " + colors.lime + "http://code.google.com/p/selenium/wiki/JsonWireProtocol" + colors.reset + ". ");
        console.log("Not all commands are implemented yet. visit " + colors.lime + "https://github.com/Camme/webdriverjs" + colors.reset + " for more info on webdriverjs. ");
        //Start with " + colors.lime + "-h option" + colors.reset + " to get a list of all commands.");
        console.log("");
        console.log(colors.yellow + "=====================================================================================" + colors.reset);
        console.log("");
        infoHasBeenShown = true;
    }

};

// this funciton is an entry point for adding new commands 
WebdriverJs.prototype.addCommand = function(commandName, command) {
    var self = this;

    if (this[commandName]) {
        throw "The command '" + commandName + "' is already defined!";
    }

    this[commandName] = this.commandLoader.addQueueItem(command,commandName);

    return self;
};

//  send the protocol command to the webdriver server
WebdriverJs.prototype.executeProtocolCommand = function(requestOptions, callback, data) {
    var request = this.createRequest(requestOptions, data, callback);
    var stringData = JSON.stringify(data);

    if (this.logLevel === 'verbose' && stringData != "{}")
    {
        this.log(colors.brown + "DATA\t\t " + colors.reset + stringData);
    }

    request.write(stringData);
    request.end();
};


// a basic extend method
WebdriverJs.prototype.extend = function(base, obj) {
    var newObj = {};
    for(var prop1 in base)
    {
        newObj[prop1] = base[prop1];
    }
    for(var prop2 in obj)
    {
        newObj[prop2] = obj[prop2];
    }
    return newObj;
};


WebdriverJs.prototype.testMode = function() {
    this.log(colors.yellow + "NOW IN TEST MODE!" + colors.reset + "\n");
    this.logLevel = 'silent';
    return this;
};

WebdriverJs.prototype.silent = function() {
    this.logLevel = 'silent';
    return this;
};

// A log helper with fancy colors
WebdriverJs.prototype.log = function(message, content) {
    if(this.logLevel !== 'verbose'){
        return false;
    }

    var currentDate = new Date();
    var dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0];

    if (!content)
    {
        console.log(colors.dkgray + "[" + dateString + "]: " + colors.reset, message);
    }
    else
    {
        console.log(colors.dkgray +"[" + dateString + "]: " + colors.reset, message, "\t", JSON.stringify(content));
    }

};

// log test result
WebdriverJs.prototype.showTest = function(theTest, receivedValue, expectedValue, message) {
    if (theTest) {
        console.log(colors.green + "✔" + colors.reset + "\t" + message);
    } else {
        console.log(colors.red + "✖" + colors.reset + "\t" + message + "\t" + colors.white + expectedValue + colors.reset + " !== " + colors.red + receivedValue + colors.reset);
    }
};