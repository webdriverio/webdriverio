exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/window_handle",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};