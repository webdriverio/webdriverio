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
    this.startPath      = '/wd/hub',

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

        var self = this;
        var baseOptions = { saveScreenshotOnError: true};

        return function(response) {

            var data = '';

            response.setEncoding('utf8');
            response.on('data', function(chunk) { data += chunk.toString(); });
            response.on('end', function() {

                if(this.sessionID === null) {
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


                if (result.status === 0) {
                    log.result(result.value);
                } else if (result.status === 7 || result.status === 11) {
                    error = {
                        status: result.status,
                        type: errorCodes[result.status].id,
                        orgStatusMessage: errorCodes[result.status].message
                    };
                    result.value = -1;

                    log.result(errorCodes[result.status].id);
                } else {

                    if (errorCodes[result.status]) {
                        log.error(errorCodes[result.status].id + "\t" + errorCodes[result.status].message + '\n\t\t\t' + result.value.message);
                    } else {
                        log.error(errorCodes["-1"].id + "\t" + errorCodes["-1"].message);
                    }

                    error = {
                        status: result.status,
                        type: errorCodes[result.status].id,
                        orgStatusMessage: errorCodes[result.status].message
                    };

                    if (process.argv.length > 1) {

                        var runner = process.argv[1].replace(/\.js/gi, "");

                        var prePath = "";

                        if (self.screenshotPath === "") {
                            prePath = runner;
                        }
                        else {
                            prePath = self.screenshotPath + runner.substring(runner.lastIndexOf("/") + 1);
                        }

                        // dont save the screenshot if its an unknown error
                        if (result.status != 13) {
                            var errorScreenshotFileName = prePath + "-ERROR.AT." + self.currentQueueItem.commandName + ".png";
                            log.data('SAVING SCREENSHOT WITH FILENAME: '+errorScreenshotFileName);
                            self.writeFile(errorScreenshotFileName, result.value.screen);
                        }
                    }
                }

                if (!this.sessionID) {
                    log.error('NO SESSION, EXITING');
                    process.exit(1);
                }

                if (callback) {
                    callback(error,result);
                }
            }.bind(this));
        }.bind(this);
    };
};
