/**
 * Logger module
 *
 * A Logger helper with fancy colors
 */

var fs           = require('fs'),
    path         = require('path'),
    colors       = require('./colors'),
    errorCodes   = require('./errorCodes'),
    sanitizeCaps = require('../helpers/sanitize').caps,
    validator    = require('validator');

var Logger = function(options, eventHandler){
    var self = this;

    // log level
    // silent : no logs
    // command : command only
    // result : result only
    // error : error only
    // verbose : command + data + result
    this.logLevel = options.logLevel;

    /**
     * create write stream if logOutput is a string
     */
    if(typeof options.logOutput === 'string') {
        var newDate = new Date(),
            dateString = newDate.toISOString().split(/\./)[0],
            filename = sanitizeCaps(options.desiredCapabilities) + '.' + dateString + '.' + process.pid + '.log';
        this.writeStream = fs.createWriteStream(path.join(process.cwd(), options.logOutput, filename));
        this.logLevel = this.logLevel === 'silent' ? 'verbose' : this.logLevel;
    } else if(typeof options.logOutput === 'object' && options.logOutput.writable) {
        this.writeStream = options.logOutput;
        this.logLevel = this.logLevel === 'silent' ? 'verbose' : this.logLevel;
    }

    /**
     * disable colors if coloredLogs is set to false or if we pipe output into files
     */
    if(!JSON.parse(process.env.WEBDRIVERIO_COLORED_LOGS) || this.writeStream) {
        Object.keys(colors).forEach(function(colorName) {
            colors[colorName] = '';
        });
    }

    // print welcome message
    if (this.logLevel !== 'silent' && !this.infoHasBeenShown) {
        this.write('\n' + colors.yellow + '=======================================================================================' + colors.reset);
        this.write('Selenium 2.0/webdriver protocol bindings implementation with helper commands in nodejs.');
        this.write('For a complete list of commands, visit ' + colors.lime + 'http://webdriver.io/docs.html' + colors.reset + '. ');
        this.write(colors.yellow + '=======================================================================================' + colors.reset + '\n');
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

    // register event handler to log info events
    eventHandler.on('info', function(msg) {
        if (self.logLevel === 'verbose') {
            self.info(msg);
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
            } else if(typeof data.message === 'string') {
                self.error('ServerError\t' + data.message);
            } else {
                self.error(errorCodes['-1'].id + '\t' + errorCodes['-1'].message);
            }
        }

    });
};

Logger.prototype.write = function(msg) {
    msg = Array.prototype.slice.call(arguments).join(' ');

    if(this.writeStream) {
        this.writeStream.write(msg + '\n');
    } else {
        console.log(msg);
    }
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
        this.write(colors.dkgray + '[' + dateString + '] ' + colors.reset, message);
    } else {
        this.write(colors.dkgray +'[' + dateString + '] ' + colors.reset, message, '\t', JSON.stringify(content));
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
    this.write('\n');
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

    if(typeof result === 'string' && validator.isBase64(result)) {
        result = '[base64] ' + result.length + ' bytes';
    } else if (typeof result === 'object') {
        result = JSON.stringify(result);
    }

    this.log(colors.teal + 'RESULT\t\t ' + colors.reset + result);
};

/**
 * logs info messages
 * @param  {String} msg  message
 */
Logger.prototype.info = function (msg) {
    this.log(colors.blue + 'INFO\t' + colors.reset + msg);
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
 * print exception if command fails
 * @param {String}   type        error type
 * @param {String}   message     error message
 * @param {String[]} stacktrace  error stacktrace
 */
Logger.prototype.printException = function(type, message, stacktrace) {
    stacktrace = stacktrace.map(function(trace) {
        return '    at ' + trace;
    });
    this.write(colors.dkred + (type || 'Error') + ': ' + message + colors.reset, null);
    this.write(colors.dkgray + stacktrace.reverse().join('\n') + colors.reset, null);
};

/**
 * helper method to check size of object
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
