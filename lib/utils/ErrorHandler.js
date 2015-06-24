'use strict';

var util = require('util'),
    errorCodes = require('./errorCodes');

function ErrorHandler(type, msg) {
    Error.captureStackTrace(this, this.constructor);

    var i = 1;

    if(arguments.length === 2) {
        this.message = msg;
        this.type = type;
    } else if(arguments.length === 1 && typeof type === 'number') {

        // if ID is not known error throw UnknownError
        if(!errorCodes[type]) {
            type = 13;
        }

        this.type = errorCodes[type].id;
        this.message = errorCodes[type].message;
    } else if(arguments.length === 1) {
        this.type = 'WebdriverIOError';
        this.message = type;
        i = 0;
    }

    if(typeof this.message === 'object') {

        var seleniumStack = this.message;

        if(seleniumStack.message && seleniumStack.type && seleniumStack.status) {
            if(seleniumStack.orgStatusMessage && seleniumStack.orgStatusMessage.match(/"errorMessage":"NoSuchElement"/)) {
                seleniumStack.type = 'NoSuchElement';
                seleniumStack.status = 7;
                seleniumStack.message = errorCodes['7'].message;
            }

            this.message = seleniumStack.message  + ' (' + seleniumStack.type + ':' + seleniumStack.status + ')';
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

            this.message = problem;
        }

    }

}

util.inherits(ErrorHandler, Error);

/**
 * make stack loggable
 * @return {Object} error log
 */
ErrorHandler.prototype.toJSON = function() {
    return {
        name: this.type,
        message: this.message
    };
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

function pad(str, width) {
    return Array(width - str.length).join(' ') + str;
}

module.exports = ErrorHandler;
