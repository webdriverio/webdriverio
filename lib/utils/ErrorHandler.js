var util = require('util'),
    colors = require('./colors'),
    errorCodes = require('./errorCodes');

module.exports = ErrorHandler;

function ErrorHandler(type, msg) {
    Error.call(this);

    var i = 1;

    if(arguments.length === 2) {
        this.message = msg;
        this.name = type;
    } else if(arguments.length === 1 && typeof type === 'number') {

        // if ID is not known error throw UnknownError
        if(!errorCodes[type]) {
            type = 13;
        }

        this.name = errorCodes[type].id;
        this.message = errorCodes[type].message;
    } else if(arguments.length === 1) {
        this.name = 'WebdriverJSError';
        this.message = type;
        i = 0;
    }

    if(typeof this.message === 'object') {

        var seleniumStack = this.message;
        this.message = [];

        if(seleniumStack.message && seleniumStack.type && seleniumStack.status) {
            this.status = seleniumStack.status;
            this.message.push(pad('', 6) + '(' + seleniumStack.type + ':' + seleniumStack.status + ') ' + seleniumStack.message);
        }

        if(seleniumStack.orgStatusMessage) {
            var reqPos = seleniumStack.orgStatusMessage.indexOf(',"request"'),
                problem;

            if(reqPos > 0) {
                problem = JSON.parse(seleniumStack.orgStatusMessage.slice(0,reqPos) + '}').errorMessage;
            } else {
                problem = seleniumStack.orgStatusMessage;
            }

            // truncate errorMessage
            if(problem.indexOf('(Session info:') > -1) {
                problem = problem.slice(0,problem.indexOf('(Session info:')).replace(/\n/g,'').trim();
            }

            // make assumption based on experience on certain error messages
            if(problem.indexOf('unknown error: path is not absolute') !== -1) {
                problem = 'you are trying to set a value to an input field with type="file", use the `uploadFile` command instead (Selenium error: ' + problem + ')';
            }

            this.message.push(pad('', 6) + 'Problem: ' + problem);
        }

        this.message = this.name + '\n' + this.message.join('\n');

    } else {
        this.message = this.name + '\n' + pad('', 6) + 'Problem: ' + this.message;
    }

}

util.inherits(ErrorHandler, Error);

/**
 * make stack loggable
 * @return {Object} error log
 */
ErrorHandler.prototype.toJSON = function() {
    return {
        name: this.name,
        message: this.message
    };
};

/**
 * chainit stringifies command arguments and calls this function to give us information about
 * which command was called
 *
 * @param {Object} cmd  contains object with command name and args
 */
ErrorHandler.prototype.addToCallStack = function(cmd) {
    if(!this.hasCallStack) {
        this.message += (GLOBAL.WDIO_GLOBALS.coloredLogs ? colors.dkgray : '') + '\n\n' + pad('', 6) + 'Callstack:\n';
        this.hasCallStack = true;
    }

    /**
     * since JSON.stringify() omits to serialize function attributes we need replace the first appearance
     * of "none" in all execute functions with "[Function]"
     *
     * @see  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
     *
     * > If undefined, a function, or a symbol is encountered during conversion it is either omitted
     *   (when it is found in an object) or censored to null (when it is found in an array).
     */
    if(cmd.name.match(/(e|E)xecute/)) {
        cmd.args = cmd.args.replace(/null/,'[Function]');
    }

    this.message += pad('-> ', 9) + cmd.name + cmd.args + '\n';
};

/**
 * Checks the status code saved to this error handler and determines if this is a timeout error
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#Response_Status_Codes
 * @returns {Boolean} - true if ErrorHandler has status code of timeout error
 */
ErrorHandler.prototype.isScriptTimeoutError = function () {
    return this.status === 28;
};

ErrorHandler.CommandError = function(msg) {
    return new ErrorHandler('CommandError',msg);
};
ErrorHandler.ProtocolError = function(msg) {
    return new ErrorHandler('ProtocolError',msg);
};
ErrorHandler.RuntimeError = function(msg) {
    return new ErrorHandler('RuntimeError',msg);
};

/**
 * @desc Human readable error format in case an async check for a selector fails
 * @param {String} commandName - Name of the command used to (e.g. 'waitForVisible')
 * @param {String} selector - Selector used
 * @param {String} checkType - Type of check performed.  E.g. 'waitForVisible'
 * would specify 'visible' (or 'invisible' if reverse was true)
 * @returns {ErrorHandler} - error handler containing human readable string
 */
ErrorHandler.SelectorTimeoutError = function (commandName, selector, checkType) {
    commandName = commandName || 'Unknown command';
    selector = selector || 'Unknown selector';
    checkType = checkType || 'Unkown check type';
    var message = commandName + ' failed.  Selector: ' + selector + ' failed to find element that was ' + checkType;
    return new ErrorHandler('SelectorTimeoutError', message);
};

function pad(str, width) {
    return Array(width - str.length).join(' ') + str;
}
