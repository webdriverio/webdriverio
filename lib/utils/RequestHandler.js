/**
 * RequestHandler 
 */

var http       = require('http'),
    log        = require('./log'),
    extend     = require('./extend'),
    errorCodes = require('./errorCodes');

var RequestHandler = module.exports = function(options) {

    'use strict';

    this.sessionID      = null;
    this.startPath      = '/wd/hub';

    this.defaultOptions = {
        host: options.host || 'localhost',
        port: options.port || 4444,
        method: 'POST'
    };
    this.defaultOptions = extend(this.defaultOptions, options);

    this.defaultHeaders = {
        'content-type': 'application/json',
        'charset': 'charset=UTF-8'
    };

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

        log.command(this.fullRequestOptions.method, this.fullRequestOptions.path);
        log.data(data);

        if(this._authString){
            var buf = new Buffer(this._authString);
            this.fullRequestOptions.headers.Authorization = 'Basic '+ buf.toString('base64');
        }

        // we need to set the requests content-length. either from the data that is sent or 0 if nothing is sent
        if (data !== "") {
            this.fullRequestOptions.headers['content-length'] = Buffer.byteLength(JSON.stringify(data));
        } else {
            this.fullRequestOptions.headers['content-length'] = 0;
        }

        var request = http.request(this.fullRequestOptions, this.proxyResponse(callback));

        request.write(this.data);

        request.on("error", function(err) {
            log.error(err);
        }.bind(this));
    };

    /**
     * set session ID for the next request
     *
     * @param {Object} response  response data with header information
     */
    this.setSessionID = function(response) {

        try {
            var locationList = response.headers.location.split("/");
            var sessionId    = locationList[locationList.length - 1];
            this.sessionID   = sessionId;

            log('SET SESSION ID ' + sessionId);
        } catch(err) {
            log.error('COULDNT GET A SESSION ID');
        }

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

        if (newOptions.path && newOptions.path !== "") {
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

                // if we dont have asession id we set it here, unless we
                // call commands that dont require session ids, for
                // example /sessions. The call to /sessions is not
                // connected to a session itself and it therefore doesnt
                // require it
                if(this.sessionID === null && this.fullRequestOptions.requiresSession !== false) {
                    this.setSessionID(response);
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
                        callback({error: true, message:"no session id"});
					}

					if (callback) {
						callback(err, res);
					}
				}.bind(this));
            }.bind(this));
        }.bind(this);
    };
};
