/**
 * log module
 *
 * A log helper with fancy colors
 */

var fs         = require('fs'),
    path       = require('path'),
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

    // where to save the screenshots. default to current folder
    this.screenshotPath = args.screenshotPath;

    // print welcome message
    if (this.logLevel !== 'silent' && !this.infoHasBeenShown) {
        console.log('\n' + colors.yellow + '=====================================================================================' + colors.reset + '\n\n');
        console.log('Selenium 2.0/webdriver protocol bindings implementation with helper commands in nodejs.');
        console.log('For a complete list of commands, visit ' + colors.lime + 'http://code.google.com/p/selenium/wiki/JsonWireProtocol' + colors.reset + '. ');
        console.log('Not all commands are implemented yet. visit ' + colors.lime + 'https://github.com/Camme/webdriverjs' + colors.reset + ' for more info on webdriverjs.\n\n');
        console.log(colors.yellow + '=====================================================================================' + colors.reset + '\n');
        this.infoHasBeenShown = true;
    }
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
        console.log(colors.dkgray + '[' + dateString + ']: ' + colors.reset, message);
    } else {
        console.log(colors.dkgray +'[' + dateString + ']: ' + colors.reset, message, '\t', JSON.stringify(content));
    }

};

/**
 * logs command messages
 * @param  {String} method  method of command request
 * @param  {String} path    path of command request
 */
log.command = function(method, path) {
    if(method && path && (this.logLevel === 'command' || this.logLevel === 'verbose')) {
        this.log(colors.violet + 'COMMAND\t' + colors.reset + method, path);
    }
};

/**
 * logs data messages
 * @param  {Object} data  data object
 */
log.data = function(data) {
    if(data && Object.size(data) !== 0 && (this.logLevel === 'data' || this.logLevel === 'verbose')) {
        this.log(colors.brown + 'DATA\t\t ' + colors.reset + JSON.stringify(data));
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
        this.log(colors.teal + 'RESULT\t\t ' + colors.reset + result);
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
            this.error(errorCodes[result.status].id + '\t' + errorCodes[result.status].message + '\n\t\t\t' + result.value.message);
        } else {
            this.error(errorCodes['-1'].id + '\t' + errorCodes['-1'].message);
        }

        error = {
            status: result.status,
            type: errorCodes[result.status].id,
            message: errorCodes[result.status].message,
            orgStatusMessage: result.value.message
        };

        if (process.argv.length > 1) {
            this.saveErrorScreenshot(result);
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

    if(msg && typeof msg === 'string' && msg.indexOf('ID does not correspond to an open view') !== -1) {
        msg = msg.substr(0,msg.indexOf('ID does not correspond to an open view'));
        msg += 'NOTE: you probably try to continue your tests after closing a tab/window. Please set the focus on a current opened tab/window to continue. Use the window protocol command to do so.';
    }

    if(msg && (this.logLevel === 'error' || this.logLevel === 'verbose' || force)) {
        this.log(colors.red + 'ERROR\t' + colors.reset + msg, null, force);
    }
};

/**
 * saves error screenshot given by driver response
 * @param  {Object} result  response of wire request
 */
log.saveErrorScreenshot = function(result) {

    // find runner script
    var executionPath = path.resolve('.'),
        filePath = path.resolve(__dirname),
        rootPath;

    if(!this.screenshotPath) {
        // doesn't save any error screenshot at all
        return;
    }
    if(this.screenshotPath === '') {
        // if no path is given use the execution path
        prePath = executionPath;
    } else if(this.screenshotPath[0] === '/') {
        // if given path is absolute use it directly
        prePath = this.screenshotPath;
    } else {
        // if not, use the root path (contains ./node_modules/webdriverjs)
        rootPath = filePath.split('/');
        rootPath = rootPath.slice(0,rootPath.length - 4).join('/');
        prePath = rootPath + '/' + this.screenshotPath;
    }

    // don't save the screenshot if its an unknown error
    if (result.value.screen && result.value.screen.length) {

        var errorScreenshotFileName = prePath + '/ERROR.' + errorCodes[result.status].id + '.png';
        this.data('SAVING SCREENSHOT WITH FILENAME: ' + errorScreenshotFileName);

        // saves screenshot to file
        fs.writeFileSync(errorScreenshotFileName, result.value.screen, 'base64', function() {
            log.error('Couldn\'t save error screenshot at ' + errorScreenshotFileName);
        });
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
