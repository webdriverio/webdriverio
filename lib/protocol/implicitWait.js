module.exports = function implicitWait (ms, callback) {

    var requestOptions = {
        path:"/session/:sessionId/timeouts/implicit_wait",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{ms: ms},callback);
};