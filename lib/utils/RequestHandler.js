var http   = require("http"),
    colors = require('./colors');

var RequestHandler = module.exports = function(scope,options) {

    this.scope          = scope;
    this.sessionID      = null;
    this.startPath      = '/wd/hub',

    this.defaultOptions = {
        host: options.host || 'localhost',
        port: options.port || 4444,
        method: 'POST'
    };

    this.defaultHeaders = {
        'content-type': 'application/json',
        'charset': 'charset=UTF-8'
    };

    /**
     * 
     */
    this.create = function(requestOptions, data, callback) {

        this.data = JSON.stringify(data);

        this.fullRequestOptions = this.createOptions(requestOptions);
        this.fullRequestOptions.headers = this.defaultHeaders;

        this.scope.log(colors.violet + "COMMAND\t" + colors.reset + this.fullRequestOptions.method, this.fullRequestOptions.path);
        this.scope.log(colors.brown + "DATA\t\t " + colors.reset + this.data);

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
            this.scope.log(colors.red + "ERROR ON REQUEST" + colors.reset);
            console.log(colors.red, err, colors.reset);
        }.bind(this));
    };

    /**
     * set session ID for the next request
     */
    this.setSessionID = function(response) {

        try {
            var locationList = response.headers.location.split("/");
            var sessionId    = locationList[locationList.length - 1];
            this.sessionID   = sessionId;

            this.scope.log("SET SESSION ID ", sessionId);
        } catch(err) {
            this.scope.log(colors.red + "COULDNT GET A SESSION ID" + colors.reset);
        }

    };

    /**
     * [createOptions description]
     * @param  {[type]} requestOptions [description]
     * @return {[type]}                [description]
     */
    this.createOptions = function(requestOptions) {
        var newOptions = this.extend(this.defaultOptions, requestOptions);
        var path = this.startPath;

        if (this.sessionId) {
            newOptions.path = newOptions.path.replace(':sessionId', this.sessionId);
        }

        if (newOptions.path && newOptions.path !== "") {
            path += newOptions.path;
        }

        newOptions.path = path;

        return newOptions;
    };

    /**
     * strip the content from unwanted characters
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
     * [extend description]
     * @param  {[type]} base [description]
     * @param  {[type]} obj  [description]
     * @return {[type]}      [description]
     */
    this.extend = function(base, obj) {
        var newObj = {};

        for(var prop1 in base) {
            newObj[prop1] = base[prop1];
        }

        for(var prop2 in obj) {
            newObj[prop2] = obj[prop2];
        }

        return newObj;
    };

    /**
     * 
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

                var result;

                try {
                    result = JSON.parse(self.strip(data));
                } catch (err) {
                    if (data !== "") {
                        this.scope.log("/n" + colors.red + err + colors.reset + "/n");
                        this.scope.log(colors.dkgrey + data + colors.reset + "/n");
                    }

                    result = {value: -1};

                    if (callback) {
                        callback(result);
                    }

                    return;
                }


                if (result.status === 0) {
                    this.scope.log(colors.teal + "RESULT\t"  + colors.reset, result.value);
                }
                else if (result.status === 7) {
                    result = {value: -1, status: result.status, orgStatus: result.status, orgStatusMessage: errorCodes[result.status].message};
                    this.scope.log(colors.teal + "RESULT\t"  + colors.reset, errorCodes[result.status].id);
                }
                else if (result.status === 11) {
                    result = {value: -1, error: errorCodes[result.status].id, status: result.status, orgStatus: result.status, orgStatusMessage: errorCodes[result.status].message};
                    this.scope.log(colors.teal + "RESULT\t"  + colors.reset, errorCodes[result.status].id);
                }
                else {
                    // remove the content of the screenshot temporarily so that cthe consle output isnt flooded
                    var screenshotContent = result.value.screen;
                    delete result.value.screen;
                    if (errorCodes[result.status]) {
                        this.scope.log(colors.red + "ERROR\t"  + colors.reset + "" + errorCodes[result.status].id + "\t" + errorCodes[result.status].message);

                    }
                    else {
                        this.scope.log(colors.red + "ERROR\t"  + colors.reset + "\t", result + "\t" + errorCodes["-1"].message);
                    }

                    try {
                        var jsonData = JSON.parse(this.strip(data));
                        this.scope.log("\t\t" + jsonData.value.message);
                    }
                    catch(err) {
                        this.scope.log("\t\t" + data);
                    }


                    // add the screenshot again
                    result.value.screen = screenshotContent;
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
                            self.log(colors.red + "SAVING SCREENSHOT WITH FILENAME:" + colors.reset);
                            self.log(colors.brown + errorScreenshotFileName + colors.reset);
                                self.saveScreenshotToFile(errorScreenshotFileName, result.value.screen);
                            }
                        }
                    }

                    if (!this.sessionId) {
                        this.scope.log(colors.red + "NO SESSION, EXITING" + colors.reset);
                        process.exit(1);
                    }

                    if (callback) {
                        callback(result);
                    }
                }
            );
        }.bind(this);
    };
};
