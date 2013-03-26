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

    infoHasBeenShown = false,
    // startPath = '/wd/hub',
    defaultOptions = {};


var WebdriverJs = module.exports = function(options) {

    'use strict';

    var self = this,
        queue = [],
        root = {children:[]},
        currentQueueScope = root.children;

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

    // defaultOptions = {
    //     host: options.host || 'localhost',
    //     port: options.port || 4444,
    //     method: 'POST'
    // };

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

// create a set of request options
// WebdriverJs.prototype.createOptions = function(requestOptions) {
//     var newOptions = this.extend(defaultOptions, requestOptions);
//     var path = startPath;

//     if (this.sessionId) {
//         newOptions.path = newOptions.path.replace(':sessionId', this.sessionId);
//     }

//     if (newOptions.path && newOptions.path !== "") {
//         path += newOptions.path;
//     }

//     newOptions.path = path;

//     return newOptions;
// };

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

// strip the content from unwanted characters
// WebdriverJs.prototype.strip = function(str) {
//     var x = [],
//         i = 0,
//         il = str.length;

//     for(i; i < il; i++){
//         if (str.charCodeAt(i))
//         {
//             x.push(str.charAt(i));
//         }
//     }

//     return x.join('');
// };




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


// a helper function to create a callback that doesnt return anything
WebdriverJs.prototype.proxyResponseNoReturn = function(callback) {
    return function(response)
    {
        if (callback) {
            callback();
        }
    };
};


// WebdriverJs.prototype.createRequest = function(requestOptions, data, callback) {

//     if (typeof data == "function") {
//         callback = data;
//         data = "";
//     }

//     var fullRequestOptions = this.createOptions(requestOptions);

//     this.log(colors.violet + "COMMAND\t" + colors.reset + fullRequestOptions.method, fullRequestOptions.path);

//     fullRequestOptions.headers = {
//         'content-type': 'application/json',
//         'charset': 'charset=UTF-8'
//     };
//     if(this._authString){
//         var buf = new Buffer(this._authString);
//         fullRequestOptions.headers.Authorization = 'Basic '+ buf.toString('base64');
//     }

//     // we need to set the requests content-length. either from the data that is sent or 0 if nothing is sent
//     if (data !== "") {
//         fullRequestOptions.headers['content-length'] = Buffer.byteLength(JSON.stringify(data));
//     } else {
//         fullRequestOptions.headers['content-length'] = 0;
//     }

//     var request = http.request(fullRequestOptions, callback);

//     var self = this;
//     request.on("error", function(err) {
//         self.log(colors.red + "ERROR ON REQUEST" + colors.reset);
//         console.log(colors.red, err, colors.reset);
//     });

//     return request;
// };


// a helper function to create a callback that parses and checks the result
// WebdriverJs.prototype.proxyResponse = function(callback, options) {

//     var self = this;
//     var baseOptions = { saveScreenshotOnError: true};

//     return function(response) {
//         response.setEncoding('utf8');

//         var data = "";
//         response.on('data', function(chunk) { data += chunk.toString(); });

//         response.on('end', function() {
//             if (options) {
//                 if (options.setSessionId) {
//                     try {
//                         var locationList = response.headers.location.split("/");
//                         var sessionId = locationList[locationList.length - 1];
//                         self.sessionId = sessionId;
//                         self.log("SET SESSION ID ", sessionId);
//                     }
//                     catch(err) {
//                         self.log(colors.red + "COULDNT GET A SESSION ID" + colors.reset);
//                     }

//                 }
//             }
//             var result;

//             try {
//                 result = JSON.parse(self.strip(data));
//             }
//             catch (err) {
//                 if (data !== "") {
//                     self.log("/n" + colors.red + err + colors.reset + "/n");
//                     self.log(colors.dkgrey + data + colors.reset + "/n");
//                 }
//                 console.log(result);
//                 result = {value: -1};

//                 if (callback) {
//                     callback(result);
//                 }

//                 return;
//             }


//             if (result.status === 0) {
//                 self.log(colors.teal + "RESULT\t"  + colors.reset, result.value);
//             }
//             else if (result.status === 7) {
//                 result = {value: -1, status: result.status, orgStatus: result.status, orgStatusMessage: errorCodes[result.status].message};
//                 self.log(colors.teal + "RESULT\t"  + colors.reset, errorCodes[result.status].id);
//             }
//             else if (result.status === 11) {
//                 result = {value: -1, error: errorCodes[result.status].id, status: result.status, orgStatus: result.status, orgStatusMessage: errorCodes[result.status].message};
//                 self.log(colors.teal + "RESULT\t"  + colors.reset, errorCodes[result.status].id);
//             }
//             else {
//                 // remove the content of the screenshot temporarily so that cthe consle output isnt flooded
//                 var screenshotContent = result.value.screen;
//                 delete result.value.screen;
//                 if (errorCodes[result.status]) {
//                     self.log(colors.red + "ERROR\t"  + colors.reset + "" + errorCodes[result.status].id + "\t" + errorCodes[result.status].message);

//                 }
//                 else {
//                     self.log(colors.red + "ERROR\t"  + colors.reset + "\t", result + "\t" + errorCodes["-1"].message);
//                 }

//                 try {
//                     var jsonData = JSON.parse(self.strip(data));
//                     self.log("\t\t" + jsonData.value.message);
//                 }
//                 catch(err) {
//                     self.log("\t\t" + data);
//                 }


//                 // add the screenshot again
//                 result.value.screen = screenshotContent;
//                 if (process.argv.length > 1) {

//                     var runner = process.argv[1].replace(/\.js/gi, "");

//                     var prePath = "";

//                     if (self.screenshotPath === "") {
//                         prePath = runner;
//                     }
//                     else {
//                         prePath = self.screenshotPath + runner.substring(runner.lastIndexOf("/") + 1);
//                     }

//                     // dont save the screenshot if its an unknown error
//                     if (result.status != 13) {
//                         var errorScreenshotFileName = prePath + "-ERROR.AT." + self.currentQueueItem.commandName + ".png";
//                         self.log(colors.red + "SAVING SCREENSHOT WITH FILENAME:" + colors.reset);
//                         self.log(colors.brown + errorScreenshotFileName + colors.reset);
//                             self.saveScreenshotToFile(errorScreenshotFileName, result.value.screen);
//                         }
//                     }
//                 }

//                 if (!self.sessionId) {
//                     self.log(colors.red + "NO SESSION, EXITING" + colors.reset);
//                     process.exit(1);
//                 }

//                 if (callback) {
//                 //  console.log("run callback for protocol")
//                     callback(result);
//                 }
//             }
//         );
//     };
// };

// log test result
WebdriverJs.prototype.showTest = function(theTest, receivedValue, expectedValue, message) {
    if (theTest) {
        console.log(colors.green + "✔" + colors.reset + "\t" + message);
    } else {
        console.log(colors.red + "✖" + colors.reset + "\t" + message + "\t" + colors.white + expectedValue + colors.reset + " !== " + colors.red + receivedValue + colors.reset);
    }
};