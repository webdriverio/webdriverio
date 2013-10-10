exports.command = function(windowHandle, callback) {

    var data,
        requestOptions = {
            path: '/session/:sessionId/window'
        };

    if(typeof windowHandle === 'string') {
        requestOptions.method = 'POST';
        data = {'name':windowHandle};
    } else {
        requestOptions.method = 'DELETE';
        data = {};
        callback = windowHandle;
    }

    this.requestHandler.create(requestOptions,data,callback);

};