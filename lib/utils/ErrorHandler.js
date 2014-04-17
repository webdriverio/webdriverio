var util = require('util'),
    colors = require('./colors.js');

module.exports = ErrorHandler;

function ErrorHandler(type, msg) {
    Error.call(this);

    var that = this,
        i = 1;

    // Write our opts to the object
    this.message = msg;
    this.name = type;

    if(arguments.length === 1) {
        this.name = 'WebdriverJSError';
        this.message = type;
        i = 0;
    }

    if(typeof this.message === 'object') {

        var seleniumStack = this.message;
        this.message = [];

        if(seleniumStack.message && seleniumStack.type && seleniumStack.status) {
            this.message.push(pad('', 5) + '(' + seleniumStack.type + ':' + seleniumStack.status + ') ' + seleniumStack.message);
        }

        if(seleniumStack.orgStatusMessage) {
            var problem = JSON.parse(seleniumStack.orgStatusMessage.slice(0,seleniumStack.orgStatusMessage.indexOf(',"request"')) + '}');
            this.message.push(pad('', 6) + 'Problem: ' + problem.errorMessage);
        }

        this.message = this.message.join('\n');

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
}

ErrorHandler.CommandError = function(msg) {
    return new ErrorHandler('CommandError',msg);
}
ErrorHandler.ProtocolError = function(msg) {
    return new ErrorHandler('ProtocolError',msg);
}
ErrorHandler.RuntimeError = function(msg) {
    return new ErrorHandler('RuntimeError',msg);
}

function pad(str, width) {
    return Array(width - str.length).join(' ') + str;
};