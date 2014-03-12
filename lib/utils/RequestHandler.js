'use strict';

/**
 * RequestHandler
 */

var request    = require('request'),
    log        = require('./log'),
    merge      = require('deepmerge'),
    errorCodes = require('./errorCodes');

module.exports = RequestHandler;

function RequestHandler(options) {
    options = options || {};

    this.sessionID      = null;
    this.startPath      = '/wd/hub';

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
RequestHandler.prototype.setSessionID = function(data,response) {
    this.sessionID = data.sessionId;

    // check if we got a session id
    if(!this.sessionID) {
        console.log('\n');
        log.error('COULDNT GET A SESSION ID', true);

        if(typeof data.message === 'string') {
            log.error(data.message,true);
        } else if(data.value) {
            log.error(data.value.message,true);
            log.error(data.value.origValue,true);
        }

        log.log('Exiting process with 1', null, true);
        process.exit(1);
        return;
    }

    log('SET SESSION ID ' + this.sessionID);
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

    log.command(this.fullRequestOptions.method, this.fullRequestOptions.uri);
    log.data(data);

    request(this.fullRequestOptions, function(err, response, body) {
        if(err && err.code === 'ECONNREFUSED') {
            console.log('\n');
            log.error('Couldn\'t find a running selenium server instance on hostname ' + this.defaultOptions.hostname + ' and port ' + this.defaultOptions.port, true);
            log.log('Exiting process with 1', null, true);
            process.exit(1);
        } else if(err && err.code === 'ENOTFOUND') {
            console.log('\n');
            log.error('Couldn\'t resolve hostname ' + this.defaultOptions.hostname + ' on port ' + this.defaultOptions.port, true);
            log.log('Exiting process with 1', null, true);
            process.exit(1);
        } else if(err) {
            log.error(err);
            callback(err);
        }

        // if we dont have a session id we set it here, unless we
        // call commands that dont require session ids, for
        // example /sessions. The call to /sessions is not
        // connected to a session itself and it therefore doesnt
        // require it
        // TOOD: this should be done in init func
        if(this.sessionID === null && this.fullRequestOptions.requiresSession !== false) {
            this.setSessionID(body,response);
        }

        // there is no result
        // fire callback immediately
        if(body === undefined && callback) {
            body = {
                status: 0,
                orgStatusMessage: errorCodes[0].message
            };

            callback(err,body);
            return;
        }

        log.result(body, data, function (err, res) {
            if (!this.sessionID && this.fullRequestOptions.requiresSession !== false) {
                log.error('NO SESSION, EXITING');
                callback({error: true, message: 'no session id'});
            }

            if (callback) {
                callback(err, res);
            }
        }.bind(this));
    }.bind(this));
};