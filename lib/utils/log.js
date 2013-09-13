/**
 * log module
 *
 * A log helper with fancy colors
 */

var fs         = require('fs'),
    colors     = require('./colors'),
    errorCodes = require('./errorCodes');

var log = function(args){

    'use strict';

    if(typeof args === 'string') {
        log.log(args);
    } else {
        log.init(args);
    }

    return log;

};

log.init = function(args) {

    // log level
    // silent : no logs
    // command : command only
    // result : result only
    // error : error only
    // verbose : command + data + result
    this.logLevel = args.logLevel;

    // print welcome message
    if (this.logLevel !== 'silent' && !this.infoHasBeenShown) {
        console.log("");
        console.log(colors.yellow + "=====================================================================================" + colors.reset);
        console.log("");
        console.log("Selenium 2.0/webdriver protocol bindings implementation with helper commands in nodejs by Camilo Tapia.");
        console.log("For a complete list of commands, visit " + colors.lime + "http://code.google.com/p/selenium/wiki/JsonWireProtocol" + colors.reset + ". ");
        console.log("Not all commands are implemented yet. visit " + colors.lime + "https://github.com/Camme/webdriverjs" + colors.reset + " for more info on webdriverjs. ");
        console.log("");
        console.log(colors.yellow + "=====================================================================================" + colors.reset);
        console.log("");
        this.infoHasBeenShown = true;
    }

    // where to save the screenshots. default to current folder
    this.screenshotPath = "";
};

/**
 * main log function
 */
log.log = function(message, content, force) {

    if(this.logLevel === 'silent' && !force) {
        return;
    }

    var currentDate = new Date();
    var dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0];

    if (!content) {
        console.log(colors.dkgray + "[" + dateString + "]: " + colors.reset, message);
    } else {
        console.log(colors.dkgray +"[" + dateString + "]: " + colors.reset, message, "\t", JSON.stringify(content));
    }

};

/**
 * logs command messages
 * @param  {String} method  method of command request
 * @param  {String} path    path of command request
 */
log.command = function(method, path) {
    if(method && path && (this.logLevel === 'command' || this.logLevel === 'verbose')) {
        this.log(colors.violet + "COMMAND\t" + colors.reset + method, path);
    }
};

/**
 * logs data messages
 * @param  {Object} data  data object
 */
log.data = function(data) {
    if(data && Object.size(data) !== 0 && (this.logLevel === 'data' || this.logLevel === 'verbose')) {
        this.log(colors.brown + "DATA\t\t " + colors.reset + JSON.stringify(data));
    }
};

/**
 * helper method to log result messages
 * @param  {Object} result  result object
 */
log._result = function (result) {
    if(typeof result === 'object') {
        result = JSON.stringify(result);
    }

    // prevent screenshot data output
    if(result.length > 1000) {
        result = '[Buffer] screenshot data';
    }

    // if result is empty, dont prin't an empty string
    if(typeof result === 'string' && result.length === 0) {
        return;
    }

    if(result !== undefined && (this.logLevel === 'result' || this.logLevel === 'verbose')) {
        this.log(colors.teal + "RESULT\t\t " + colors.reset + result);
    }
};

/**
 * logs result messages
 * @param  {Object} result  result object
 * @param  {Object} data  data object
 * @param  {Function} callback callback object
 */
log.result = function(result, data, callback) {
    var error  = null;

    if (result.status === 0) {
        this._result(result.value);
    } else if (result.status === 7 || result.status === 11) {
        error = {
            status: result.status,
            type: errorCodes[result.status].id,
            message : errorCodes[result.status].message,
            orgStatusMessage: result.value.message
        };
        result.value = -1;

        this._result(errorCodes[result.status].id);
    } else {

        if (errorCodes[result.status]) {
            this.error(errorCodes[result.status].id + "\t" + errorCodes[result.status].message + '\n\t\t\t' + result.value.message);
        } else {
            this.error(errorCodes["-1"].id + "\t" + errorCodes["-1"].message);
        }

        error = {
            status: result.status,
            type: errorCodes[result.status].id,
            message : errorCodes[result.status].message,
            orgStatusMessage: result.value.message
        };

        if (process.argv.length > 1) {

            var runner = process.argv[1].replace(/\.js/gi, "");

            var prePath = "";

            if (this.screenshotPath === "") {
                prePath = runner;
            }
            else {
                prePath = this.screenshotPath + runner.substring(runner.lastIndexOf("/") + 1);
            }

            // dont save the screenshot if its an unknown error
            if (result.status != 13) {
                var errorScreenshotFileName = prePath + "-ERROR." + errorCodes[result.status].id + ".png";
                this.data('SAVING SCREENSHOT WITH FILENAME: '+errorScreenshotFileName);
                this.writeFile(errorScreenshotFileName, result.value.screen);
            }
        }
    }

    if (callback) {
        callback(error,result);
    }
};

/**
 * logs error messages
 * @param  {String} msg  error message
 */
log.error = function(msg, force) {

    if(msg && typeof msg === 'string' && msg.indexOf('caused by Request') !== -1) {
        msg = msg.substr(0,msg.indexOf('caused by Request') - 2);
    }

    if(msg && typeof msg === 'string' && msg.indexOf('Command duration or timeout') !== -1) {
        msg = msg.substr(0,msg.indexOf('Command duration or timeout'));
    }

    if(msg && (this.logLevel === 'error' || this.logLevel === 'verbose' || force)) {
        this.log(colors.red + "ERROR\t" + colors.reset + msg, null, force);
    }
};

/**
 * logs command tree
 * @param  {QueueItem} rootItem  root item of tree
 */
log.executionOrder = function(rootItem) {
    this.printChildren(rootItem,0);
};

/**
 * logs current queue item and ist children
 * @param  {QueueItem} item   current queue item
 * @param  {Number}    depth  count of nested element
 */
log.printChildren = function(item,depth) {

    var pre = '';
    for(var j = 0; j < depth; ++j) {
        pre += '  ';
    }
    pre += '|--';

    console.log(pre,item.commandName);
    for(var i = 0; i < item.children.length; ++i) {
        this.printChildren(item.children[i],depth+1);
    }
};

// saves screenshot to file
log.writeFile = function(fileName, data, callback) {
    fs.writeFileSync(fileName, data, "base64", function(err) {
        callback(err);
    });
};

/**
 * helper method to check size ob object
 * @param   {Object}   obj  object you like to check
 * @return  {Integer}       number of own properties
 */
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

module.exports = log;
