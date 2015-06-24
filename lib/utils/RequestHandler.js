'use strict';

/**
 * RequestHandler
 */

var Q = require('q'),
    url = require('url'),
    request = require('request'),
    errorCodes = require('./errorCodes'),
    ErrorHandler = require('./ErrorHandler'),
    packageDotJson  = require('../../package.json');

module.exports = RequestHandler;

function RequestHandler(options, eventHandler, logger) {

    this.sessionID = null;
    this.startPath = '/wd/hub';
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
 * set session ID for the next request
 *
 * @param {Object} response  response data with header information
 */
RequestHandler.prototype.setSessionID = function(body, response, data) {
    this.sessionID = body.sessionId;

    // check if we got a session id
    /* istanbul ignore next */
    if(!this.sessionID) {
        this.eventHandler.emit('error', {
            err: {
                code: 'NOSESSIONID',
                message: body.message
            },
            body: body,
            requestOptions: this.fullRequestOptions,
            response: response
        });
        throw new Error('NOSESSIONID');
    }

    this.eventHandler.emit('init', {
        sessionID: this.sessionID,
        options: body.value,
        desiredCapabilities: data.desiredCapabilities
    });

    this.logger.log('SET SESSION ID ' + this.sessionID);
};

/**
 * merges default options with request options
 *
 * @param  {Object} requestOptions  request options
 */
RequestHandler.prototype.createOptions = function(requestOptions, data) {

    var newOptions = {};

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
        newOptions.body = data;
        newOptions.method = 'POST';
        newOptions.json = true;
    }

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

    var defer = Q.defer();

    if (typeof requestOptions === 'string') {
        requestOptions = {
            path: requestOptions
        };
    }

    data = data || {};

    this.fullRequestOptions = this.createOptions(requestOptions, data);

    this.eventHandler.emit('command', {
        method: this.fullRequestOptions.method || 'GET',
        uri: this.fullRequestOptions.uri,
        data: data
    });

    request(this.fullRequestOptions, function(err, response, body) {
        var error = null;

        if(err || (body && body.status !== 0)) {

            this.eventHandler.emit('error', {
                err: err,
                requestData: data,
                requestOptions: this.fullRequestOptions,
                response: response,
                body: body
            });

            if(body && typeof body === 'string') {

                error = new ErrorHandler.RuntimeError(body);

            } else if(body) {

                error = new ErrorHandler.RuntimeError({
                    status: body.status,
                    type: errorCodes[body.status] ? errorCodes[body.status].id : 'unknown',
                    message: errorCodes[body.status] ? errorCodes[body.status].message : 'unknown',
                    orgStatusMessage: body.value ? body.value.message : ''
                });

            } else {

                //TODO this error should not cause node to stop. run `grunt test-mobile` if Safari is not configured.
                error = new ErrorHandler.RuntimeError({
                    status: -1,
                    type: 'ECONNREFUSED',
                    message: 'Couldn\'t connect to selenium server',
                    orgStatusMessage: 'Couldn\'t connect to selenium server'
                });

            }

            return defer.reject(error);
        }

        // if we don't have a session id we set it here, unless we
        // call commands that don't require session ids, for
        // example /sessions. The call to /sessions is not
        // connected to a session itself and it therefore doesn't
        // require it
        if(this.sessionID === null && requestOptions.requiresSession !== false) {
            this.setSessionID(body,response,data);
        }

        if(body === undefined) {
            body = {
                status: 0,
                orgStatusMessage: errorCodes[0].message
            };
        }

        this.eventHandler.emit('result', {
            requestData: data,
            requestOptions: this.fullRequestOptions,
            response: response,
            body: body
        });

        return defer.resolve(body);

    }.bind(this));

    return defer.promise;
};
