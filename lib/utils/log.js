/**
 * log module
 *
 * A log helper with fancy colors
 */

var colors     = require('./colors');

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
};

/**
 * main log function
 */
log.log = function(message, content) {

    if(this.logLevel === 'silent') {
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
 * logs result messages
 * @param  {Object} result  result object
 */
log.result = function(result) {

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
 * logs error messages
 * @param  {String} msg  error message
 */
log.error = function(msg) {

    if(msg && msg.indexOf('caused by Request') !== -1) {
        msg = msg.substr(0,msg.indexOf('caused by Request') - 2);
    }

    if(msg && msg.indexOf('Command duration or timeout') !== -1) {
        msg = msg.substr(0,msg.indexOf('Command duration or timeout'));
    }

    if(msg && (this.logLevel === 'error' || this.logLevel === 'verbose')) {
        this.log(colors.red + "ERROR\t" + colors.reset + msg);
    }
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