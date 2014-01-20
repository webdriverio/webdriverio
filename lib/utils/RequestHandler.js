/**
 * RequestHandler
 */

var request    = require('request'),
    log        = require('./log'),
    extend     = require('lodash.merge'),
    errorCodes = require('./errorCodes');

var RequestHandler = function(options) {

    'use strict';

    this.sessionID      = null;
    this.startPath      = '/wd/hub';

    // default request options
    this.defaultOptions = {
        hostname: 'localhost',
        port: 4444,
        method: 'POST',
        protocol: 'http:',
        auth: null,
        slashes: true,
        search: null,
        query: null
    };

    // set auth from user and password configs
    if(options.user && options.key) {
        this.auth = {
            user: options.user,
            pass: options.key
        };
    }

    // add user specific attributes
    this.defaultOptions = extend(this.defaultOptions, options);

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

        // if not, data didn't contain this information, last change is
        // trying to get the ID in the old fashioned way via header.location
        try {
            var locationList = response.headers.location.split('/');
            var sessionId    = locationList[locationList.length - 1];
            this.sessionID   = sessionId;
        } catch(err) {

            // if that wasn't successful output an error message and
            // exit process with 1
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
    }

    log('SET SESSION ID ' + this.sessionID);

};

    /**
     * extends default options with request options
     *
     * @param  {Object} requestOptions  request options
     */
RequestHandler.prototype.createOptions = function(requestOptions) {
    var uri = this.startPath,
        newOptions = {};

    uri += requestOptions.path.replace(':sessionId', this.sessionID || '');
    
    // send authentication credentials only when creating new session
    if (requestOptions.path === '/session' && this.auth !== undefined) {
        newOptions.auth = this.auth;
    }

    newOptions.url = extend(this.defaultOptions, {
        host: this.defaultOptions.hostname + ':' + this.defaultOptions.port,
        path: uri,
        pathname: uri,
        href: this.defaultOptions.protocol + '//' + this.defaultOptions.hostname + ':' + this.defaultOptions.port + uri
    });

    newOptions.method = requestOptions.method;
    newOptions.encoding = 'utf8';
    newOptions.headers = {
        Connection: 'keep-alive'
    };

    return newOptions;
};

/**
 * strip the content from unwanted characters
 *
 * @param  {String} str  result data
 */
RequestHandler.prototype.strip = function(str) {
    var x = [],
        i = 0,
        il = str.length;

    for(i; i < il; i++){
        if (str.charCodeAt(i))
        {
            x.push(str.charAt(i));
        }
    }

    return x.join('');
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

    this.fullRequestOptions = this.createOptions(requestOptions);
    this.fullRequestOptions.json = data;

    log.command(this.fullRequestOptions.method, this.fullRequestOptions.url.path);
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

module.exports = RequestHandler;
