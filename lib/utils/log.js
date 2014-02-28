/**
 * log module
 *
 * A log helper with fancy colors
 */

var fs           = require('fs'),
    path         = require('path'),
    colors       = require('./colors'),
    errorCodes   = require('./errorCodes'),
    EventHandler = require('./EventHandler');

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
    var self = this;

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
        console.log('\n' + colors.yellow + '=======================================================================================' + colors.reset);
        console.log('Selenium 2.0/webdriver protocol bindings implementation with helper commands in nodejs.');
        console.log('For a complete list of commands, visit ' + colors.lime + 'http://webdriver.io/docs.html' + colors.reset + '. ');
        console.log(colors.yellow + '=======================================================================================' + colors.reset + '\n');
        this.infoHasBeenShown = true;
    }

    // register event handler to log command events
    EventHandler.on('command', function(data) {
        if(self.logLevel === 'command' || self.logLevel === 'verbose') {
            log.command(data.method, data.uri);
        }
        if(self.logLevel === 'data' || self.logLevel === 'verbose') {
            log.data(data.data);
        }
    });
    
    // register event handler to log result events
    EventHandler.on('result', function(data) {
        // only log result events if they got executed successfully
        if(data.body.status === 0 && (self.logLevel === 'result' || self.logLevel === 'verbose')) {
            log.result(data.body.value || data.body.orgStatusMessage);
        }
    })

    // register event handler to log error events
    EventHandler.on('error', function(data) {

        // quit process if no connection to a selenium server has been resolved
        if(data.err && data.err.code === 'ECONNREFUSED') {
            log.error('Couldn\'t find a running selenium server instance on ' + data.requestOptions.uri);
            log.log('Exiting process with 1');
            process.exit(1);
        } else if(data.err && data.err.code === 'ENOTFOUND') {
            log.error('Couldn\'t resolve hostname ' + data.requestOptions.uri);
            log.log('Exiting process with 1');
            process.exit(1);
        } else if(data.err && data.err.code === 'NOSESSIONID') {
            log.error('Couldn\'t get a session ID - ' + data.err.message);
            log.log('Exiting process with 1');
            process.exit(1);
        }

        if(self.logLevel === 'error' || self.logLevel === 'verbose') {
            if (errorCodes[data.body.status]) {
                self.error(errorCodes[data.body.status].id + '\t' + errorCodes[data.body.status].message + '\n\t\t\t' + data.body.value.message);
            } else {
                self.error(errorCodes['-1'].id + '\t' + errorCodes['-1'].message);
            }
        }

    });
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
    console.log(method,path);
    if(method && path) {
        this.log(colors.violet + 'COMMAND\t' + colors.reset + method, path);
    }
};

/**
 * logs data messages
 * @param  {Object} data  data object
 */
log.data = function(data) {

    data = JSON.stringify(data);

    if(data.length > 1000) {
        data = '[String Buffer]';
    }

    if(data && Object.size(data) !== 0 && (this.logLevel === 'data' || this.logLevel === 'verbose')) {
        this.log(colors.brown + 'DATA\t\t ' + colors.reset + data);
    }
};

/**
 * logs result messages
 * @param  {Object} result  result object
 */
log.result = function (result) {
    
    // if result is empty, dont prin't an empty string
    if(!result || (typeof result === 'string' && result.length === 0)) {
        return;
    }

    if(typeof result === 'object') {
        result = JSON.stringify(result);
    }

    // prevent screenshot data output
    if(result.length > 1000) {
        result = '[Buffer] screenshot data';
    }

    this.log(colors.teal + 'RESULT\t\t ' + colors.reset + result);
};

/**
 * logs error messages
 * @param  {String} msg  error message
 */
log.error = function(msg) {

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

    if(msg) {
        this.log(colors.red + 'ERROR\t' + colors.reset + msg, null);
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
