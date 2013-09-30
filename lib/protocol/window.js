exports.command = function(windowHandle, callback) {

    var requestOptions = {
        path: '/session/:sessionId/window',
        method: typeof windowHandle === 'string' ? 'POST' : 'DELETE'
    };

    var data = typeof windowHandle === 'string' ? {'name':windowHandle} : {};

    this.requestHandler.create(requestOptions,data,callback);

};