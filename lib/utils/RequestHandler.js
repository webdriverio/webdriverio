'use strict';

/**
 * RequestHandler
 */

var request      = require('request'),
    merge        = require('deepmerge'),
    errorCodes   = require('./errorCodes');

module.exports = RequestHandler;

function RequestHandler(instance) {
    var options = instance.options || {};

    this.instance  = instance;
    this.sessionID = null;
    this.startPath = '/wd/hub';

    // Wdjs calls RequestHandler with `host` badly set
    // A host is an hostname+port
    if (options.host !== undefined) {
        options.hostname = options.host;
        delete options.host;
    }

    // default request options
    this.defaultOptions = {
        hostname: '127.0.0.1',
        port: 4444,
        protocol: 'http'
    };

    // add user specific attributes
    this.defaultOptions = merge(this.defaultOptions, options);

    // set auth from user and password configs
    if(this.defaultOptions.user && this.defaultOptions.key) {
        this.auth = {
            user: this.defaultOptions.user,
            pass: this.defaultOptions.key
        };

        delete this.defaultOptions.user;
        delete this.defaultOptions.key;
    }
};

/**
 * set session ID for the next request
 *
 * @param {Object} response  response data with header information
 */
RequestHandler.prototype.setSessionID = function(body,response,data) {
    this.sessionID = body.sessionId;

    // check if we got a session id
    /* istanbul ignore next */
    if(!this.sessionID) {
        this.instance.eventHandler.emit('error', {
            err: {
                code: 'NOSESSIONID',
                message: body.message
            },
            body: body,
            requestOptions: this.fullRequestOptions,
            response: response
        });
        return;
    }

    this.instance.eventHandler.emit('init', {
        sessionID: this.sessionID,
        options: body.value,
        desiredCapabilities: data.desiredCapabilities
    });

    this.instance.logger.log('SET SESSION ID ' + this.sessionID);
};

    /**
     * merges default options with request options
     *
     * @param  {Object} requestOptions  request options
     */
RequestHandler.prototype.createOptions = function(requestOptions, data) {
    var url = require('url');
    var newOptions = {};

    newOptions.uri =
        this.defaultOptions.protocol + '://' +
        this.defaultOptions.hostname + ':' + this.defaultOptions.port +
        this.startPath +
        requestOptions.path.replace(':sessionId', this.sessionID || '')

    // send authentication credentials only when creating new session
    if (requestOptions.path === '/session' && this.auth !== undefined) {
        newOptions.auth = this.auth;
    }

    if (requestOptions.method) {
        newOptions.method = requestOptions.method;
    }

    newOptions.json = true;
    newOptions.followAllRedirects = true;

    // needed by any JAVA server dealing with json
    // thus selenium server. We should not have
    // to set charset on a json request
    newOptions.headers = {
        'content-type': 'application/json; charset=UTF-8'
    }

    if (Object.keys(data).length > 0) {
        // what we should be doing
        // newOptions.body = data
        // but wait for https://github.com/mikeal/request/issues/784
        // to be merged
        newOptions.body = JSON.stringify(data);
        newOptions.method = 'POST';
    }

    return newOptions;
};

/**
 * creates a http request with its given options and send the protocol
 * command to the webdriver server
 *
 * @param  {Object}   requestOptions  defines url, method and other request options
 * @param  {Object}   data            contains request data
 * @param  {Function} callback        gets fired if server got a response
 */
RequestHandler.prototype.create = function(requestOptions, data, callback) {
    if (typeof requestOptions === 'string') {
        requestOptions = {
            path: requestOptions
        }
    }

    if (typeof data === 'function') {
        callback = data;
        data = {};
    }

    this.fullRequestOptions = this.createOptions(requestOptions, data);

    this.instance.eventHandler.emit('command', {
        method: this.fullRequestOptions.method || 'GET',
        uri: this.fullRequestOptions.uri,
        data: data
    });

    request(this.fullRequestOptions, function(err, response, body) {
        var error = null;
        var makeError = require('./makeError');

        if(err || (body && body.status !== 0)) {
            this.instance.eventHandler.emit('error', {
                err: err,
                requestData: data,
                requestOptions: this.fullRequestOptions,
                response: response,
                body: body
            });

            if(body) {
                error = makeError({
                    status: body.status,
                    type: errorCodes[body.status] ? errorCodes[body.status].id : 'unknown',
                    message: errorCodes[body.status] ? errorCodes[body.status].message : 'unknown',
                    orgStatusMessage: body.value ? body.value.message : ''
                });
            } else {
                error = makeError({
                    status: -1,
                    type: 'ECONNREFUSED',
                    message: 'Couldn\'t connect to selenium server',
                    orgStatusMessage: 'Couldn\'t connect to selenium server'
                });
                // TODO skip rest of driver commands
                return callback(error);
            }
        }

        // if we dont have a session id we set it here, unless we
        // call commands that dont require session ids, for
        // example /sessions. The call to /sessions is not
        // connected to a session itself and it therefore doesnt
        // require it
        if(this.sessionID === null && this.fullRequestOptions.requiresSession !== false) {
            this.setSessionID(body,response,data);
        }

        if(body === undefined) {
            body = {
                status: 0,
                orgStatusMessage: errorCodes[0].message
            };
        }

        this.instance.eventHandler.emit('result', {
            requestData: data,
            requestOptions: this.fullRequestOptions,
            response: response,
            body: body,
        });

        if (callback) {
            callback(error, error ? null : body);
        }

    }.bind(this));
};