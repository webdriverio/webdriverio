exports.command = function (windowHandle, callback) {

    var requestOptions = {
        path:"/session/:sessionId/window",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{"name":windowHandle},callback);

};