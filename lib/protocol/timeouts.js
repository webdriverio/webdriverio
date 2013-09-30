exports.command = function (type, ms, callback) {

    var requestOptions = {
        path:"/session/:sessionId/timeouts",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{type: type, ms: ms},callback);
};

