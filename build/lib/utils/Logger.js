'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _helpersConstants = require('../helpers/constants');

var _helpersSanitize = require('../helpers/sanitize');

var _helpersSanitize2 = _interopRequireDefault(_helpersSanitize);

var BANNER = '\n' + _helpersConstants.COLORS.yellow + '=======================================================================================' + _helpersConstants.COLORS.reset + '\nSelenium 2.0 / webdriver protocol bindings implementation with helper commands in nodejs.\nFor a complete list of commands, visit ' + _helpersConstants.COLORS.lime + 'http://webdriver.io/docs.html' + _helpersConstants.COLORS.reset + '.\n' + _helpersConstants.COLORS.yellow + '=======================================================================================' + _helpersConstants.COLORS.reset + '\n';

/**
 * Logger module
 *
 * A Logger helper with fancy colors
 */

var Logger = (function () {
    function Logger(options, eventHandler) {
        var _this = this;

        _classCallCheck(this, Logger);

        /**
         * log level
         * silent : no logs
         * command : command only
         * result : result only
         * error : error only
         * verbose : command + data + result
         */
        this.logLevel = options.logLevel;

        this.setupWriteStream(options);

        /**
         * disable colors if coloredLogs is set to false or if we pipe output into files
         */
        if (!JSON.parse(process.env.WEBDRIVERIO_COLORED_LOGS) || this.writeStream) {
            _Object$keys(_helpersConstants.COLORS).forEach(function (colorName) {
                return _helpersConstants.COLORS[colorName] = '';
            });
        }

        /**
         * print welcome message
         */
        if (this.logLevel !== 'silent' && this.logLevel !== 'error' && !this.infoHasBeenShown) {
            this.write(BANNER);
            this.infoHasBeenShown = true;
        }

        // register event handler to log command events
        eventHandler.on('command', function (data) {
            if (_this.logLevel === 'command' || _this.logLevel === 'verbose') {
                _this.command(data.method, data.uri.path);
            }
            if (_this.logLevel === 'data' || _this.logLevel === 'verbose') {
                _this.data(data.data);
            }
        });

        eventHandler.on('info', function (msg) {
            if (_this.logLevel === 'verbose') {
                _this.info(msg);
            }
        });

        // register event handler to log result events
        eventHandler.on('result', function (data) {
            // only log result events if they got executed successfully
            if (data.body && data.body.status === 0 && (_this.logLevel === 'result' || _this.logLevel === 'verbose')) {
                _this.result(typeof data.body.value ? data.body.value : data.body.orgStatusMessage);
            }
        });

        // register event handler to log error events
        eventHandler.on('error', function (data) {
            if (data.err && data.err.code === 'ECONNREFUSED') {
                _this.error('Couldn\'t find a running selenium server instance on ' + data.requestOptions.uri);
            } else if (data.err && data.err.code === 'ENOTFOUND') {
                _this.error('Couldn\'t resolve hostname ' + data.requestOptions.uri);
            } else if (data.err && data.err.code === 'NOSESSIONID') {
                _this.error('Couldn\'t get a session ID - ' + data.err.message);
            } else if (_this.logLevel === 'error' || _this.logLevel === 'verbose') {
                if (data.body && _helpersConstants.ERROR_CODES[data.body.status]) {
                    _this.error(_helpersConstants.ERROR_CODES[data.body.status].id + '\t' + _helpersConstants.ERROR_CODES[data.body.status].message + '\n\t\t\t' + data.body.value.message);
                } else if (typeof data.message === 'string') {
                    _this.error('ServerError\t' + data.message);
                } else {
                    _this.error(_helpersConstants.ERROR_CODES['-1'].id + '\t' + _helpersConstants.ERROR_CODES['-1'].message);
                }
            }
        });
    }

    /**
     * creates log file name and directories if not existing
     * @param  {Object} caps          capabilities (required to create filename)
     * @param  {String} logOutputPath specified log directory
     * @return {Buffer}               log file buffer stream
     */

    _createClass(Logger, [{
        key: 'getLogfile',
        value: function getLogfile(caps, logOutputPath) {
            logOutputPath = _path2['default'].isAbsolute(logOutputPath) ? logOutputPath : _path2['default'].join(process.cwd(), logOutputPath);

            /**
             * create directory if not existing
             */
            try {
                _fs2['default'].statSync(logOutputPath);
            } catch (e) {
                _mkdirp2['default'].sync(logOutputPath);
            }

            var newDate = new Date();
            var dateString = newDate.toISOString().split(/\./)[0].replace(/\:/g, '-');
            var filename = _helpersSanitize2['default'].caps(caps) + '.' + dateString + '.' + process.pid + '.log';

            return _fs2['default'].createWriteStream(_path2['default'].join(logOutputPath, filename));
        }

        /**
         * create write stream if logOutput is a string
         */
    }, {
        key: 'setupWriteStream',
        value: function setupWriteStream(options) {
            if (typeof options.logOutput === 'string') {
                this.writeStream = this.getLogfile(options.desiredCapabilities, options.logOutput);
                this.logLevel = this.logLevel === 'silent' ? 'verbose' : this.logLevel;
            } else if (typeof options.logOutput === 'object' && options.logOutput.writable) {
                this.writeStream = options.logOutput;
                this.logLevel = this.logLevel === 'silent' ? 'verbose' : this.logLevel;
            }
        }
    }, {
        key: 'write',
        value: function write() {
            for (var _len = arguments.length, messages = Array(_len), _key = 0; _key < _len; _key++) {
                messages[_key] = arguments[_key];
            }

            var msgString = messages.join(' ');

            if (this.writeStream) {
                this.writeStream.write(msgString + '\n');
            } else {
                console.log(msgString);
            }
        }

        /**
         * main log function
         */
    }, {
        key: 'log',
        value: function log(message, content) {
            if (!this.logLevel || this.logLevel === 'silent') {
                return;
            }

            var currentDate = new Date();
            var dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0];
            var preamble = _helpersConstants.COLORS.dkgray + '[' + dateString + '] ' + _helpersConstants.COLORS.reset;

            if (!content) {
                this.write(preamble, message);
            } else {
                this.write(preamble, message, '\t', JSON.stringify(_helpersSanitize2['default'].limit(content)));
            }
        }

        /**
         * logs command messages
         * @param  {String} method  method of command request
         * @param  {String} path    path of command request
         */
    }, {
        key: 'command',
        value: function command(method, path) {
            if (method && path) {
                this.log(_helpersConstants.COLORS.violet + 'COMMAND\t' + _helpersConstants.COLORS.reset + method, path);
            }
        }

        /**
         * debugger info message
         */
    }, {
        key: 'debug',
        value: function debug() {
            this.write('\n');
            this.log(_helpersConstants.COLORS.yellow + 'DEBUG\t' + _helpersConstants.COLORS.reset + 'queue has stopped, you can now go into the browser');
            this.log(_helpersConstants.COLORS.yellow + 'DEBUG\t' + _helpersConstants.COLORS.dkgray + 'continue by pressing the [ENTER] key ...' + _helpersConstants.COLORS.reset);
        }

        /**
         * logs data messages
         * @param  {Object} data  data object
         */
    }, {
        key: 'data',
        value: function data(_data) {
            _data = JSON.stringify(_helpersSanitize2['default'].limit(_data));
            if (_data && (this.logLevel === 'data' || this.logLevel === 'verbose')) {
                this.log(_helpersConstants.COLORS.brown + 'DATA\t\t' + _helpersConstants.COLORS.reset + _data);
            }
        }

        /**
         * logs info messages
         * @param  {String} msg  message
         */
    }, {
        key: 'info',
        value: function info(msg) {
            this.log(_helpersConstants.COLORS.blue + 'INFO\t' + _helpersConstants.COLORS.reset + msg);
        }

        /**
         * logs result messages
         * @param  {Object} result  result object
         */
    }, {
        key: 'result',
        value: function result(_result) {
            _result = _helpersSanitize2['default'].limit(JSON.stringify(_result));
            this.log(_helpersConstants.COLORS.teal + 'RESULT\t\t' + _helpersConstants.COLORS.reset + _result);
        }

        /**
         * logs error messages
         * @param  {String} msg  error message
         */
    }, {
        key: 'error',
        value: function error(msg) {
            if (msg && typeof msg === 'string' && msg.indexOf('caused by Request') !== -1) {
                msg = msg.substr(0, msg.indexOf('caused by Request') - 2);
            }

            if (msg && typeof msg === 'string' && msg.indexOf('Command duration or timeout') !== -1) {
                msg = msg.substr(0, msg.indexOf('Command duration or timeout'));
            }

            if (msg && typeof msg === 'string' && msg.indexOf('ID does not correspond to an open view') !== -1) {
                msg = msg.substr(0, msg.indexOf('ID does not correspond to an open view'));
                msg += 'NOTE: you probably try to continue your tests after closing a tab/window. Please set the focus on a current opened tab/window to continue. Use the window protocol command to do so.';
            }

            if (msg) {
                this.log(_helpersConstants.COLORS.red + 'ERROR\t' + _helpersConstants.COLORS.reset + msg, null);
            }
        }

        /**
         * print exception if command fails
         * @param {String}   type        error type
         * @param {String}   message     error message
         * @param {String[]} stacktrace  error stacktrace
         */
    }], [{
        key: 'printException',
        value: function printException(type, message, stacktrace) {
            stacktrace = stacktrace.map(function (trace) {
                return '    at ' + trace;
            });
            this.write(_helpersConstants.COLORS.dkred + (type || 'Error') + ': ' + message + _helpersConstants.COLORS.reset, null);
            this.write(_helpersConstants.COLORS.dkgray + stacktrace.reverse().join('\n') + _helpersConstants.COLORS.reset, null);
        }
    }]);

    return Logger;
})();

exports['default'] = Logger;
module.exports = exports['default'];
