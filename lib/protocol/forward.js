exports.command = function (callback) {

    if(this.desiredCapabilities.browserName === 'safari') {

        this.execute('history.go(+1)');

    } else {

        var requestOptions = {
            path:"/session/:sessionId/forward",
            method:"POST"
        };

        this.requestHandler.create(requestOptions,{},callback);

    }
};
