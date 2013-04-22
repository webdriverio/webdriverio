exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/window_handles",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};