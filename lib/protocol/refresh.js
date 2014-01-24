module.exports = function refresh (callback) {

    var requestOptions = {
        path:"/session/:sessionId/refresh",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,callback);

};
