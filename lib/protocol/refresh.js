exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/refresh",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{},callback);

};
