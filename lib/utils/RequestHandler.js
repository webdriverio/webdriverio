    /**
 * RequestHandler
 */

var http       = require('http'),
    log        = require('./log'),
    extend     = require('lodash.merge'),
    errorCodes = require('./errorCodes');

module.exports = function(options) {

    'use strict';

    this.sessionID      = null;
    this.startPath      = '/wd/hub';

    // default request options
    this.defaultOptions = {
        hostname: 'localhost',
        port: 4444,
        method: 'POST',
        protocol: 'http:',
    };

    // default headers
    this.defaultHeaders = {
        'Connection': 'keep-alive',
        'Accept': 'application/json;charset=utf-8',
        'Content-Type': 'application/json;charset=utf-8',
    };

    // rename options var key
    if(options.key) {
        options.pwd = options.key;
        delete options.key;
    }

    // rename options var host
    if(options.host) {
        options.hostname = options.host;
        delete options.host;
    }

    // set auth from user and password configs
    if(options.user && options.pwd) {
        options.auth = options.user + ':' + options.pwd;

        this.defaultHeaders.Authorization = 'Basic ' + new Buffer(options.auth).toString('base64');
        this.defaultHeaders.Credentials = options.auth;

        delete options.user;
        delete options.pwd;
    }

    // add user specific attributes
    this.defaultOptions = extend(this.defaultOptions, options);


    /**
     * creates a http request with its given options and send the protocol
     * command to the webdriver server
     *
     * @param  {Object}   requestOptions  defines url, method and other request options
     * @param  {Object}   data            contains request data
     * @param  {Function} callback        gets fired if server got a response
     */
    this.create = function(requestOptions, data, callback) {

        this.data = JSON.stringify(data);

        this.fullRequestOptions = this.createOptions(requestOptions);
        this.fullRequestOptions.headers = this.defaultHeaders;
        this.fullRequestOptions.body = this.data;

        log.command(this.fullRequestOptions.method, this.fullRequestOptions.path);
        log.data(data);

        if(this._authString){
            var buf = new Buffer(this._authString);
            this.fullRequestOptions.headers.Authorization = 'Basic '+ buf.toString('base64');
        }

        // we need to set the requests content-length. either from the data that is sent or 0 if nothing is sent
        if (data !== '') {
            this.fullRequestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        } else {
            this.fullRequestOptions.headers['Content-Length'] = 0;
        }

        var request = http.request(this.fullRequestOptions, this.proxyResponse(callback));

        request.write(this.data);

        request.on('error', function(err) {
            log.error(err);

            if(err.code === 'ECONNREFUSED') {
                console.log('\n');
                log.error('Couldn\'t find a running selenium server instance on hostname ' + this.defaultOptions.hostname + ' and port ' + this.defaultOptions.port, true);
                log.log('Exiting process with 1', null, true);
                process.exit(1);
            } else if(err.code === 'ENOTFOUND') {
                console.log('\n');
                log.error('Couldn\'t resolve hostname ' + this.defaultOptions.hostname + ' on port ' + this.defaultOptions.port, true);
                log.log('Exiting process with 1', null, true);
                process.exit(1);
            } else {
                callback(err);
            }
        }.bind(this));
    };

    /**
     * set session ID for the next request
     *
     * @param {Object} response  response data with header information
     */
    this.setSessionID = function(data,response) {

        // parse data to get the sessionID
        try {
            data = JSON.parse(data);
        } catch(e) {
            // if data isn't a vaild JSON we can assume that something went wrong
            // (e.g. wrong platform/browser combination in tests on cloud services like Sauce Labs)
            // in this cases data is typeof string and contains an error message
            data = {
                message: data
            };
        }

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
    this.createOptions = function(requestOptions) {
        var newOptions = extend(this.defaultOptions, requestOptions);
        var path = this.startPath;

        if (this.sessionID) {
            newOptions.path = newOptions.path.replace(':sessionId', this.sessionID);
        }

        if (newOptions.path && newOptions.path !== '') {
            path += newOptions.path;
        }

        newOptions.path = path;

        return newOptions;
    };

    /**
     * strip the content from unwanted characters
     *
     * @param  {String} str  result data
     */
    this.strip = function(str) {
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
     * response function for all requests
     *
     * @param  {Function} callback  gets fired after response
     */
    this.proxyResponse = function(callback) {

        return function(response) {

            var data = '';

            response.setEncoding('utf8');
            response.on('data', function(chunk) { data += chunk.toString(); });
            response.on('end', function() {

                // if we dont have a session id we set it here, unless we
                // call commands that dont require session ids, for
                // example /sessions. The call to /sessions is not
                // connected to a session itself and it therefore doesnt
                // require it
                if(this.sessionID === null && this.fullRequestOptions.requiresSession !== false) {
                    this.setSessionID(data,response);
                }

                var result = {};
                var error  = null;

                try {
                    result = JSON.parse(this.strip(data));
                } catch (err) {

                    // there is no result
                    // fire callback immediately
                    if (callback) {

                        result = {
                            status: 0,
                            orgStatusMessage: errorCodes[0].message
                        };

                        callback(error,result);
                    }

                    return;
                }

                log.result(result, data, function (err, res) {
                    if (!this.sessionID && this.fullRequestOptions.requiresSession !== false) {
                        log.error('NO SESSION, EXITING');
                        callback({error: true, message: 'no session id'});
                    }

                    if (callback) {
                        callback(err, res);
                    }
                }.bind(this));
            }.bind(this));
        }.bind(this);
    };
};
