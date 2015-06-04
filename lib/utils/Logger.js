/**
 * Logger module
 *
 * A Logger helper with fancy colors
 */

var colors       = require('./colors'),
    errorCodes   = require('./errorCodes');

var Logger = function(logLevel, eventHandler){
    var self = this;

    // log level
    // silent : no logs
    // command : command only
    // result : result only
    // error : error only
    // verbose : command + data + result
    this.logLevel = logLevel;

    /**
     * disable colors if coloredLogs is set to false
     */
    if(!JSON.parse(process.env.WEBDRIVERIO_COLORED_LOGS)) {
        Object.keys(colors).forEach(function(colorName) {
            colors[colorName] = '';
        });
    }

    // print welcome message
    if (this.logLevel !== 'silent' && !this.infoHasBeenShown) {
        console.log('\n' + colors.yellow + '=======================================================================================' + colors.reset);
        console.log('Selenium 2.0/webdriver protocol bindings implementation with helper commands in nodejs.');
        console.log('For a complete list of commands, visit ' + colors.lime + 'http://webdriver.io/docs.html' + colors.reset + '. ');
        console.log(colors.yellow + '=======================================================================================' + colors.reset + '\n');
        this.infoHasBeenShown = true;
    }

    // register event handler to log command events
    eventHandler.on('command', function(data) {
        if(self.logLevel === 'command' || self.logLevel === 'verbose') {
            self.command(data.method, data.uri.path);
        }
        if(self.logLevel === 'data' || self.logLevel === 'verbose') {
            self.data(data.data);
        }
    });

    // register event handler to log result events
    eventHandler.on('result', function(data) {
        // only log result events if they got executed successfully
        if(data.body && data.body.status === 0 && (self.logLevel === 'result' || self.logLevel === 'verbose')) {
            self.result(typeof data.body.value ? data.body.value : data.body.orgStatusMessage);
        }
    });

    // register event handler to log error events
    eventHandler.on('error', function(data) {

        if(data.err && data.err.code === 'ECONNREFUSED') {
            self.error('Couldn\'t find a running selenium server instance on ' + data.requestOptions.uri);
        } else if(data.err && data.err.code === 'ENOTFOUND') {
            self.error('Couldn\'t resolve hostname ' + data.requestOptions.uri);
        } else if(data.err && data.err.code === 'NOSESSIONID') {
            self.error('Couldn\'t get a session ID - ' + data.err.message);
        } else if(self.logLevel === 'error' || self.logLevel === 'verbose') {
            if (data.body && errorCodes[data.body.status]) {
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
Logger.prototype.log = function(message, content) {

    if(!this.logLevel || this.logLevel === 'silent') {
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
Logger.prototype.command = function(method, path) {
    if(method && path) {
        this.log(colors.violet + 'COMMAND\t' + colors.reset + method, path);
    }
};

Logger.prototype.debug = function() {
    console.log('\n');
    this.log(colors.yellow + 'DEBUG\t' + colors.reset + 'queue has stopped, you can now go into the browser');
    this.log(colors.yellow + 'DEBUG\t' + colors.dkgray + 'continue by pressing the [ENTER] key ...' + colors.reset);
};

/**
 * logs data messages
 * @param  {Object} data  data object
 */
Logger.prototype.data = function(data) {

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
Logger.prototype.result = function (result) {

    // if result is undefined, null or empty don't print it
    if(typeof result === 'undefined' || (typeof result === 'object' && !result) || (typeof result === 'string' && result.length === 0)) {
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
Logger.prototype.error = function(msg) {

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

module.exports = Logger;
