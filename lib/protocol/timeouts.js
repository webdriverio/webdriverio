module.exports = function timeouts (type, ms, callback) {

    var requestOptions = {
        path:"/session/:sessionId/timeouts",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{type: type, ms: ms},callback);
};

