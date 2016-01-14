'use strict';

/**
 * RequestHandler
 */

var Q = require('q'),
    url = require('url'),
    request = require('request'),
    merge = require('deepmerge'),
    errorCodes = require('./errorCodes'),
    ErrorHandler = require('./ErrorHandler'),
    packageDotJson  = require('../../package.json');

module.exports = RequestHandler;

function processRequestWithRetry(fullRequestOptions, totalRetryCount) {

    var defer = Q.defer(),
        self = this;

    (function retry(retryCount) {
        processRequest(fullRequestOptions).then(defer.resolve).catch(function(error) {
            if(++retryCount === totalRetryCount) {
                self.eventHandler.emit('info', 'Gave up after ' + totalRetryCount + ' tries');
                return defer.reject(error);
            }

            retry(retryCount);

            self.eventHandler.emit('info', 'Retry #' + retryCount);
            self.eventHandler.emit('error', error);
        })
    })(0); // start from zero retry-count

    return defer.promise;

}

function processRequest(fullRequestOptions) {

    var defer = Q.defer();

    request(fullRequestOptions, function(err, response, body) {

        if(body) {
            // all is fine
            if(body.status === 0) {
                return defer.resolve({
                    response: response,
                    body: body
                });
            }

            if(typeof body === 'string') {
                return defer.reject(new ErrorHandler.RuntimeError(body));
            }

            return defer.reject(new ErrorHandler.RuntimeError({
                status: body.status,
                type: errorCodes[body.status] ? errorCodes[body.status].id : 'unknown',
                message: errorCodes[body.status] ? errorCodes[body.status].message : 'unknown',
                orgStatusMessage: body.value ? body.value.message : ''
            }));

        }

        defer.reject(err);

    });

    return defer.promise;

}

function RequestHandler(options, eventHandler, logger) {

    this.sessionID = null;
    this.startPath = options.path === '/' ? '' : options.path || '/wd/hub';
    this.eventHandler = eventHandler;
    this.logger = logger;
    this.defaultOptions = options;

    // Wdjs calls RequestHandler with `host` badly set
    // A host is an hostname+port
    if (options.host !== undefined) {
        options.hostname = options.host;
        delete options.host;
    }

    // set auth from user and password configs
    if(this.defaultOptions.user && this.defaultOptions.key) {
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
RequestHandler.prototype.createOptions = function(requestOptions, data) {

    var newOptions = {};

    /**
     * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
     * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
     * require it
     */
    if (requestOptions.path.match(/\:sessionId/) && !this.sessionID && requestOptions.requiresSession !== false) {
        // throw session id error
        throw new ErrorHandler(101);
    }

    newOptions.uri = url.parse(
        this.defaultOptions.protocol + '://' +
        this.defaultOptions.hostname + ':' + this.defaultOptions.port +
        this.startPath +
        requestOptions.path.replace(':sessionId', this.sessionID || ''));

    // send authentication credentials only when creating new session
    if (requestOptions.path === '/session' && this.auth !== undefined) {
        newOptions.auth = this.auth;
    }

    if (requestOptions.method) {
        newOptions.method = requestOptions.method;
    }

    newOptions.json = true;
    newOptions.followAllRedirects = true;

    newOptions.headers = {
        'Connection': 'keep-alive',
        'Accept': 'application/json',
        'User-Agent': 'webdriverio/webdriverio/' + packageDotJson.version
    };

    if (Object.keys(data).length > 0) {
        var requestData = JSON.stringify(data);
        newOptions.body = requestData;
        newOptions.method = 'POST';
        newOptions.headers = merge(newOptions.headers, {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(requestData, 'UTF-8')
        });
    }

    newOptions.timeout = this.defaultOptions.connectionRetryTimeout;

    return newOptions;
};

/**
 * creates a http request with its given options and send the protocol
 * command to the webdriver server
 *
 * @param  {Object}   requestOptions  defines url, method and other request options
 * @param  {Object}   data            contains request data
 */
RequestHandler.prototype.create = function(requestOptions, data) {

    if (typeof requestOptions === 'string') {
        requestOptions = {
            path: requestOptions
        };
    }

    data = data || {};

    var fullRequestOptions = this.createOptions(requestOptions, data);

    this.eventHandler.emit('command', {
        method: fullRequestOptions.method || 'GET',
        uri: fullRequestOptions.uri,
        data: data
    });

    return processRequestWithRetry.call(this, fullRequestOptions, this.defaultOptions.connectionRetryCount).then(function (data) {

        var body = data.body;
        var response = data.response;

        /**
         * if no session id was set before we've called the init command
         */
        if(this.sessionID === null && requestOptions.requiresSession !== false) {
            this.sessionID = body.sessionId;

            this.eventHandler.emit('init', {
                sessionID: this.sessionID,
                options: body.value,
                desiredCapabilities: data.desiredCapabilities
            });

            this.logger.log('SET SESSION ID ' + this.sessionID);
        }

        if(body === undefined) {
            body = {
                status: 0,
                orgStatusMessage: errorCodes[0].message
            };
        }

        this.eventHandler.emit('result', {
            requestData: data,
            requestOptions: fullRequestOptions,
            response: response,
            body: body
        });

        return body;

    }.bind(this));
};
