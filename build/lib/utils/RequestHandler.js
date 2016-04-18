'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _request2 = require('request');

var _request3 = _interopRequireDefault(_request2);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _helpersConstants = require('../helpers/constants');

var _ErrorHandler = require('./ErrorHandler');

var _packageJson = require('../../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

/**
 * RequestHandler
 */

var RequestHandler = (function () {
    function RequestHandler(options, eventHandler, logger) {
        _classCallCheck(this, RequestHandler);

        this.sessionID = null;
        this.startPath = options.path === '/' ? '' : options.path || '/wd/hub';
        this.gridApiStartPath = '/grid/api';
        this.eventHandler = eventHandler;
        this.logger = logger;
        this.defaultOptions = options;

        /**
         * actually host is `hostname:port` but to keep config properties
         * short we abuse host as hostname
         */
        if (options.host !== undefined) {
            options.hostname = options.host;
            delete options.host;
        }

        /**
         * set auth from user and password configs
         */
        if (this.defaultOptions.user && this.defaultOptions.key) {
            this.auth = {
                user: this.defaultOptions.user,
                pass: this.defaultOptions.key
            };

            delete this.defaultOptions.user;
            delete this.defaultOptions.key;
        }
    }

    /**
     * merges default options with request options
     *
     * @param  {Object} requestOptions  request options
     */

    _createClass(RequestHandler, [{
        key: 'createOptions',
        value: function createOptions(requestOptions, data) {
            var newOptions = {};

            /**
             * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
             * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
             * require it
             */
            if (requestOptions.path.match(/\:sessionId/) && !this.sessionID && requestOptions.requiresSession !== false) {
                // throw session id error
                throw new _ErrorHandler.RuntimeError(101);
            }

            newOptions.uri = _url2['default'].parse(this.defaultOptions.protocol + '://' + this.defaultOptions.hostname + ':' + this.defaultOptions.port + (requestOptions.gridCommand ? this.gridApiStartPath : this.startPath) + requestOptions.path.replace(':sessionId', this.sessionID || ''));

            // send authentication credentials only when creating new session
            if (requestOptions.path === '/session' && this.auth !== undefined) {
                newOptions.auth = this.auth;
            }

            if (requestOptions.method) {
                newOptions.method = requestOptions.method;
            }

            if (requestOptions.gridCommand) {
                newOptions.gridCommand = requestOptions.gridCommand;
            }

            newOptions.json = true;
            newOptions.followAllRedirects = true;

            newOptions.headers = {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'User-Agent': 'webdriverio/webdriverio/' + _packageJson2['default'].version
            };

            if (_Object$keys(data).length > 0) {
                var requestData = JSON.stringify(data);
                newOptions.body = requestData;
                newOptions.method = 'POST';
                newOptions.headers = (0, _deepmerge2['default'])(newOptions.headers, {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Content-Length': Buffer.byteLength(requestData, 'UTF-8')
                });
            }

            newOptions.timeout = this.defaultOptions.connectionRetryTimeout;

            return newOptions;
        }

        /**
         * creates a http request with its given options and send the protocol
         * command to the webdriver server
         *
         * @param  {Object}   requestOptions  defines url, method and other request options
         * @param  {Object}   data            contains request data
         */
    }, {
        key: 'create',
        value: function create(requestOptions, data) {
            var _this = this;

            data = data || {};

            /**
             * allow to pass a string as shorthand argument
             */
            if (typeof requestOptions === 'string') {
                requestOptions = {
                    path: requestOptions
                };
            }

            var fullRequestOptions = this.createOptions(requestOptions, data);

            this.eventHandler.emit('command', {
                method: fullRequestOptions.method || 'GET',
                uri: fullRequestOptions.uri,
                data: data
            });

            return this.request(fullRequestOptions, this.defaultOptions.connectionRetryCount).then(function (_ref) {
                var body = _ref.body;
                var response = _ref.response;

                /**
                 * if no session id was set before we've called the init command
                 */
                if (_this.sessionID === null && requestOptions.requiresSession !== false) {
                    _this.sessionID = body.sessionId;

                    _this.eventHandler.emit('init', {
                        sessionID: _this.sessionID,
                        options: body.value,
                        desiredCapabilities: data.desiredCapabilities
                    });

                    _this.eventHandler.emit('info', 'SET SESSION ID ' + _this.sessionID);
                }

                if (body === undefined) {
                    body = {
                        status: 0,
                        orgStatusMessage: _helpersConstants.ERROR_CODES[0].message
                    };
                }

                _this.eventHandler.emit('result', {
                    requestData: data,
                    requestOptions: fullRequestOptions,
                    response: response,
                    body: body
                });

                return body;
            });
        }
    }, {
        key: 'request',
        value: function request(fullRequestOptions, totalRetryCount) {
            var _this2 = this;

            var retryCount = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

            retryCount += 1;

            return new _Promise(function (resolve, reject) {
                (0, _request3['default'])(fullRequestOptions, function (err, response, body) {
                    /**
                     * Resolve with a healthy response
                     */
                    if (!err && body && body.status === 0) {
                        return resolve({ body: body, response: response });
                    }

                    if (fullRequestOptions.gridCommand) {
                        if (body.success) {
                            return resolve({ body: body, response: response });
                        }

                        return reject(new _ErrorHandler.RuntimeError({
                            status: 102,
                            type: _helpersConstants.ERROR_CODES[102].id,
                            message: _helpersConstants.ERROR_CODES[102].message,
                            orgStatusMessage: body.msg || 'unknown'
                        }));
                    }

                    /**
                     * in Appium you find sometimes more exact error messages in origValue
                     */
                    if (body && body.value && typeof body.value.origValue === 'string' && typeof body.value.message === 'string') {
                        body.value.message += ' ' + body.value.origValue;
                    }

                    if (body && typeof body === 'string') {
                        reject(new _ErrorHandler.RuntimeError(body));
                        return;
                    }

                    if (body) {
                        reject(new _ErrorHandler.RuntimeError({
                            status: body.status,
                            type: _helpersConstants.ERROR_CODES[body.status] ? _helpersConstants.ERROR_CODES[body.status].id : 'unknown',
                            message: _helpersConstants.ERROR_CODES[body.status] ? _helpersConstants.ERROR_CODES[body.status].message : 'unknown',
                            orgStatusMessage: body.value ? body.value.message : '',
                            screenshot: body.value && body.value.screen || null
                        }));

                        return;
                    }

                    if (retryCount === totalRetryCount) {
                        var error = null;

                        if (err && err.message.indexOf('Nock') > -1) {
                            // for better unit test error output
                            error = err;
                        } else {
                            error = new _ErrorHandler.RuntimeError({
                                status: -1,
                                type: 'ECONNREFUSED',
                                message: 'Couldn\'t connect to selenium server',
                                orgStatusMessage: 'Couldn\'t connect to selenium server'
                            });
                        }

                        reject(error);
                        return;
                    }

                    _this2.request(fullRequestOptions, totalRetryCount, retryCount).then(resolve)['catch'](reject);
                });
            });
        }
    }]);

    return RequestHandler;
})();

exports['default'] = RequestHandler;
module.exports = exports['default'];
