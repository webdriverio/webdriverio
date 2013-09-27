exports.command = function(callback) {

    var requestOptions = {
        path: '/session/:sessionId/window',
        method: 'DELETE'
    };

    this.requestHandler.create(requestOptions,{},callback);

};
