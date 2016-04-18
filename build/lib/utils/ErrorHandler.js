'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpersConstants = require('../helpers/constants');

var ErrorHandler = (function (_Error) {
    _inherits(ErrorHandler, _Error);

    function ErrorHandler(type, msg) {
        _classCallCheck(this, ErrorHandler);

        _get(Object.getPrototypeOf(ErrorHandler.prototype), 'constructor', this).call(this);
        Error.captureStackTrace(this, this.constructor);

        if (typeof msg === 'number') {
            // if ID is not known error throw UnknownError
            if (!_helpersConstants.ERROR_CODES[msg]) {
                msg = 13;
            }

            this.type = _helpersConstants.ERROR_CODES[msg].id;
            this.message = _helpersConstants.ERROR_CODES[msg].message;
        } else if (arguments.length === 2) {
            this.message = msg;
            this.type = type;
        } else if (arguments.length === 1) {
            this.type = 'WebdriverIOError';
            this.message = type;
        }

        if (typeof this.message === 'object') {
            var seleniumStack = this.message;

            if (seleniumStack.screenshot) {
                this.screenshot = seleniumStack.screenshot;
                delete seleniumStack.screenshot;
            }

            if (seleniumStack.message && seleniumStack.type && seleniumStack.status) {
                if (seleniumStack.orgStatusMessage && seleniumStack.orgStatusMessage.match(/"errorMessage":"NoSuchElement"/)) {
                    seleniumStack.type = 'NoSuchElement';
                    seleniumStack.status = 7;
                    seleniumStack.message = _helpersConstants.ERROR_CODES['7'].message;
                }

                this.message = seleniumStack.message + ' (' + seleniumStack.type + ':' + seleniumStack.status + ')';
            }

            if (seleniumStack.orgStatusMessage) {
                var reqPos = seleniumStack.orgStatusMessage.indexOf(',"request"');
                var problem = '';

                if (reqPos > 0) {
                    problem = JSON.parse(seleniumStack.orgStatusMessage.slice(0, reqPos) + '}').errorMessage;
                } else {
                    problem = seleniumStack.orgStatusMessage;
                }

                if (problem.indexOf('No enum constant org.openqa.selenium.Platform') > -1) {
                    problem = 'The Selenium backend you\'ve chosen doesn\'t support the desired platform (' + problem.slice(46) + ')';
                }

                // truncate errorMessage
                if (problem.indexOf('(Session info:') > -1) {
                    problem = problem.slice(0, problem.indexOf('(Session info:')).trim();
                }

                // make assumption based on experience on certain error messages
                if (problem.indexOf('unknown error: path is not absolute') !== -1) {
                    problem = 'You are trying to set a value to an input field with type="file", use the `uploadFile` command instead (Selenium error: ' + problem + ')';
                }

                this.message = problem;
                this.seleniumStack = seleniumStack;
            }
        }
    }

    /**
     * make stack loggable
     * @return {Object} error log
     */

    _createClass(ErrorHandler, [{
        key: 'toJSON',
        value: function toJSON() {
            return {
                name: this.type,
                message: this.message
            };
        }
    }]);

    return ErrorHandler;
})(Error);

var CommandError = function CommandError(msg) {
    return new ErrorHandler('CommandError', msg);
};
var ProtocolError = function ProtocolError(msg) {
    return new ErrorHandler('ProtocolError', msg);
};
var RuntimeError = function RuntimeError(msg) {
    return new ErrorHandler('RuntimeError', msg);
};

/**
 * Check if current error is caused by timeout
 * @param {Object} err
 * @returns {Boolean}
 */
var isTimeoutError = function isTimeoutError(e) {
    return e.message === 'Promise was rejected with the following reason: timeout';
};

exports.ErrorHandler = ErrorHandler;
exports.CommandError = CommandError;
exports.ProtocolError = ProtocolError;
exports.RuntimeError = RuntimeError;
exports.isTimeoutError = isTimeoutError;
exports['default'] = ErrorHandler;
